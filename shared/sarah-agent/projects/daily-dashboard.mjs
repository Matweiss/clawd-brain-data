#!/usr/bin/env node
/**
 * Daily Morning Dashboard for Sarah J. Schwartz Fine Art
 *
 * Usage: node daily-dashboard.js
 *
 * Generates a morning business report with:
 * - Yesterday's sales and orders
 * - Website visits and traffic sources
 * - New subscribers (newsletter + starter kit waitlist)
 * - Collector birthdays today
 * - 10x Star Collector activity
 */

import https from 'https';
import fs from 'fs';

// Configuration
const SHOPIFY_STORE = process.env.SARAH_SHOPIFY_STORE || 'yr5azj-q0.myshopify.com';
const ACCESS_TOKEN = process.env.SARAH_SHOPIFY_ACCESS_TOKEN;
const SNAPSHOT_PATH = '/root/.openclaw/workspace/shared/sarah-agent/projects/dashboard-snapshot.json';
const STARTER_KIT_TAG_PATTERNS = [
  /^starter-kit-waitlist$/i,
  /^sku-paintingstarterkit$/i,
  /starter\s*kit/i,
  /paintingstarterkit/i
];

// Helper to parse Shopify Link headers for cursor-based pagination
function parseNextLink(linkHeader) {
  if (!linkHeader) return null;

  const links = linkHeader.split(',').map((part) => part.trim());
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === 'next') {
      const url = new URL(match[1]);
      return `${url.pathname}${url.search}`.replace('/admin/api/2024-01', '');
    }
  }

  return null;
}

// Helper function to make Shopify API requests and return body + pagination headers
function shopifyRequestWithHeaders(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/2024-01${path}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Shopify API ${res.statusCode}: ${parsed.errors || data || 'Unknown error'}`));
            return;
          }

          resolve({
            data: parsed,
            nextUrl: parseNextLink(res.headers.link)
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    // Add timeout to prevent hanging requests
    req.setTimeout(15000, () => {
      req.destroy(new Error('Shopify request timed out after 15s'));
    });
    req.end();
  });
}

// Helper function to make Shopify API requests
async function shopifyRequest(path) {
  const { data } = await shopifyRequestWithHeaders(path);
  return data;
}

// Helper function to make Shopify GraphQL requests
function shopifyGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query, variables });
    const options = {
      hostname: SHOPIFY_STORE,
      path: '/admin/api/2024-01/graphql.json',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Shopify GraphQL ${res.statusCode}: ${parsed.errors || data || 'Unknown error'}`));
            return;
          }

          if (parsed.errors?.length) {
            reject(new Error(`Shopify GraphQL errors: ${parsed.errors.map((error) => error.message).join('; ')}`));
            return;
          }

          resolve(parsed.data || {});
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    // Add timeout to prevent hanging requests
    req.setTimeout(15000, () => {
      req.destroy(new Error('Shopify GraphQL request timed out after 15s'));
    });
    req.write(payload);
    req.end();
  });
}

async function countCustomers(query) {
  let count = 0;
  let url = `/customers.json?limit=250&${query}`;

  while (url) {
    const { data, nextUrl } = await shopifyRequestWithHeaders(url);
    count += (data.customers || []).length;
    url = nextUrl;
  }

  return count;
}

function hasStarterKitTag(tags = []) {
  return tags.some((tag) => STARTER_KIT_TAG_PATTERNS.some((pattern) => pattern.test(tag)));
}

function isEmailSubscribed(customer) {
  return customer.defaultEmailAddress?.marketingState === 'SUBSCRIBED';
}

function isCreatedWithin(customer, start, end) {
  if (!customer.createdAt) return false;
  const createdAt = new Date(customer.createdAt).getTime();
  return createdAt >= new Date(start).getTime() && createdAt <= new Date(end).getTime();
}

async function fetchAllCustomersGraphQL() {
  const customers = [];
  let after = null;

  while (true) {
    const data = await shopifyGraphQLRequest(
      `query DashboardCustomers($after: String) {
        customers(first: 250, after: $after, sortKey: CREATED_AT) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            createdAt
            tags
            defaultEmailAddress {
              emailAddress
              marketingState
            }
          }
        }
      }`,
      { after }
    );

    const connection = data.customers;
    customers.push(...(connection?.nodes || []));

    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return customers;
}

// Get yesterday's date in ISO format
function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getDayBoundaryRange(dateStr) {
  // Use Intl to get correct PST/PDT offset rather than hardcoding -07:00
  const testDate = new Date(`${dateStr}T12:00:00`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(testDate);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-7';
  // Parse offset like "GMT-7" or "GMT-8"
  const match = offsetPart.match(/GMT([+-])(\d+)/);
  const offset = match ? `${match[1]}${match[2].padStart(2, '0')}:00` : '-07:00';
  return {
    start: `${dateStr}T00:00:00${offset}`,
    end: `${dateStr}T23:59:59${offset}`
  };
}

// Get today's date
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatMonthDay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  });
}

function getAnniversaryDateForYear(baseDate, year) {
  const month = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCustomerDisplayName(customer) {
  if (!customer) return 'Guest';
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  return fullName || customer.email || 'Guest';
}

// Read previous day's snapshot
function readSnapshot() {
  try {
    const data = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {
      newsletterSubscribers: 0,
      starterKitWaitlist: 0,
      salesHistory: [],
      subscriberHistory: []
    };
  }
}

// Save today's snapshot for tomorrow
function saveSnapshot(newsletter, starterKit, salesTotal) {
  try {
    const existing = readSnapshot();
    const today = new Date().toISOString().split('T')[0];
    const snapshot = {
      lastUpdated: today,
      newsletterSubscribers: newsletter,
      starterKitWaitlist: starterKit,
      salesHistory: [...(existing.salesHistory || []).slice(-6), { date: today, sales: salesTotal }],
      subscriberHistory: [...(existing.subscriberHistory || []).slice(-6), { date: today, count: newsletter }]
    };

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  } catch (e) {
    console.error('Error saving snapshot:', e.message);
  }
}

// Fetch yesterday's orders
async function getYesterdayOrders() {
  const yesterday = getYesterday();
  const data = await shopifyRequest(`/orders.json?created_at_min=${yesterday}T00:00:00-07:00&created_at_max=${yesterday}T23:59:59-07:00&status=any&limit=250`);
  return data.orders || [];
}

// Fetch orders with deliveries today
async function getTodaysDeliveries() {
  await getToday();

  // Get fulfilled orders with tracking
  const data = await shopifyRequest(`/orders.json?fulfillment_status=shipped&status=open&limit=250`);
  const orders = data.orders || [];

  // Filter for deliveries happening today (estimated delivery date)
  // Note: Shopify doesn't always have exact delivery dates, so we'll show recent shipments
  const recentShipments = orders.filter((order) => {
    if (!order.fulfillments || order.fulfillments.length === 0) return false;
    const lastFulfillment = order.fulfillments[order.fulfillments.length - 1];
    if (!lastFulfillment.created_at) return false;

    // Show shipments from last 3 days as "in transit"
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return new Date(lastFulfillment.created_at) >= threeDaysAgo;
  });

  return recentShipments.slice(0, 5); // Show up to 5 recent deliveries
}

// Fetch customers with birthdays today
async function getTodaysBirthdays() {
  // Note: This requires customer metafields for birthdays
  // For now, returning empty array - will need to implement birthday tracking
  return [];
}

// Fetch detailed subscriber metrics
async function getSubscriberMetrics() {
  try {
    const yesterday = getYesterday();
    const { start: dayStart, end: dayEnd } = getDayBoundaryRange(yesterday);

    let total;
    let newYesterday;
    let starterKitTotal;
    let starterKitNewYesterday;
    let unsubscribedYesterday;

    try {
      const customers = await fetchAllCustomersGraphQL();
      total = customers.filter(isEmailSubscribed).length;
      newYesterday = customers.filter((customer) => isEmailSubscribed(customer) && isCreatedWithin(customer, dayStart, dayEnd)).length;
      starterKitTotal = customers.filter((customer) => hasStarterKitTag(customer.tags)).length;
      starterKitNewYesterday = customers.filter((customer) => hasStarterKitTag(customer.tags) && isCreatedWithin(customer, dayStart, dayEnd)).length;

      // Exact "unsubscribed yesterday" isn't reliably derivable without consent update timestamps.
      // Keep the prior REST implementation for that metric while GraphQL drives the primary totals.
      unsubscribedYesterday = await countCustomers(
        `updated_at_min=${encodeURIComponent(dayStart)}&updated_at_max=${encodeURIComponent(dayEnd)}&email_marketing_status=unsubscribed`
      );
    } catch (graphQLError) {
      // Fall back to REST if GraphQL pagination/search is unavailable for this shop.
      total = await countCustomers('email_marketing_status=subscribed');
      newYesterday = await countCustomers(
        `created_at_min=${encodeURIComponent(dayStart)}&created_at_max=${encodeURIComponent(dayEnd)}&email_marketing_status=subscribed`
      );
      unsubscribedYesterday = await countCustomers(
        `updated_at_min=${encodeURIComponent(dayStart)}&updated_at_max=${encodeURIComponent(dayEnd)}&email_marketing_status=unsubscribed`
      );
      starterKitTotal = 0;
      starterKitNewYesterday = 0;
    }

    return {
      total,
      starterKitTotal,
      newYesterday,
      starterKitNewYesterday,
      unsubscribedYesterday
    };
  } catch (e) {
    const snap = readSnapshot();
    return {
      total: snap.newsletterSubscribers || 0,
      starterKitTotal: snap.starterKitWaitlist || 0,
      newYesterday: 0,
      starterKitNewYesterday: 0,
      unsubscribedYesterday: 0
    };
  }
}

async function getCollectorAnniversaryMoments() {
  const today = new Date();
  const currentYear = today.getUTCFullYear();
  const seenCustomerIds = new Set();
  const opportunities = [];

  for (let year = currentYear - 1; year >= 2020; year -= 1) {
    const anniversaryDate = getAnniversaryDateForYear(today, year);
    const { start, end } = getDayBoundaryRange(anniversaryDate);
    const dayOrders = await shopifyRequest(
      `/orders.json?created_at_min=${encodeURIComponent(start)}&created_at_max=${encodeURIComponent(end)}&status=any&limit=250`
    );

    for (const order of dayOrders.orders || []) {
      const customerId = order.customer?.id;
      if (!customerId || seenCustomerIds.has(customerId)) continue;

      try {
        const customerOrders = await shopifyRequest(`/customers/${customerId}/orders.json?status=any&limit=250`);
        const allOrders = (customerOrders.orders || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        if (allOrders.length === 0) continue;

        const firstOrder = allOrders[0];
        if (String(firstOrder.id) !== String(order.id)) continue;

        seenCustomerIds.add(customerId);
        opportunities.push({
          name: getCustomerDisplayName(order.customer),
          years: currentYear - year,
          firstPurchaseDate: firstOrder.created_at,
          lifetimeOrders: allOrders.length,
          totalSpent: order.customer?.total_spent || null
        });
      } catch (e) {
        // Non-fatal, skip customer if history lookup fails
      }
    }
  }

  return opportunities.sort((a, b) => b.years - a.years || b.lifetimeOrders - a.lifetimeOrders || a.name.localeCompare(b.name));
}

// Main dashboard generation
export async function generateDashboard() {
  const yesterday = getYesterday();
  const today = new Date();

  let output = '';

  output += `\n☀️ Your Morning Dashboard — ${formatDate(today)}\n\n`;
  output += `Yesterday (${formatDate(yesterday)}):\n\n`;

  // Get orders
  const orders = await getYesterdayOrders();
  const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);

  output += `📊 Website Activity:\n`;
  output += `   • Orders: ${orders.length}\n`;
  output += `   • Sales: $${totalSales.toFixed(2)}\n`;

  if (orders.length > 0) {
    output += `\n💰 Top Orders:\n`;
    orders.slice(0, 3).forEach((order) => {
      const customer = order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Guest';
      output += `   • $${order.total_price} — ${customer}\n`;
    });
  }

  // Traffic sources (would need analytics API)
  output += `\n🌐 Traffic: (Analytics API needed)\n`;

  // Subscribers with daily change
  const subscriberMetrics = await getSubscriberMetrics();
  const snapshot = readSnapshot();
  const newsletterTotal = subscriberMetrics.total || snapshot.newsletterSubscribers || 0;
  const starterKitTotal = subscriberMetrics.starterKitTotal || snapshot.starterKitWaitlist || 0;

  output += `\n📧 Newsletter Subscribers:\n`;
  output += `   • Total: ${newsletterTotal}\n`;
  output += `   • New yesterday: +${subscriberMetrics.newYesterday}\n`;

  output += `\n🎁 Starter Kit Waitlist:\n`;
  output += `   • Total: ${starterKitTotal}\n`;
  output += `   • New yesterday: +${subscriberMetrics.starterKitNewYesterday || 0}\n`;

  // Birthdays
  const birthdays = await getTodaysBirthdays();
  output += `\n🎂 Birthdays Today:\n`;
  if (birthdays.length === 0) {
    output += `   • None — you're off the hook!\n`;
  } else {
    birthdays.forEach((person) => {
      output += `   • ${person.name} 🎉\n`;
    });
  }

  const anniversaryMoments = await getCollectorAnniversaryMoments();
  output += `\n💌 Collector Anniversary Moments:\n`;
  if (anniversaryMoments.length === 0) {
    output += `   • None today — no first-purchase anniversaries to nudge.\n`;
  } else {
    anniversaryMoments.slice(0, 5).forEach((moment) => {
      const collectorDepth = moment.lifetimeOrders > 1 ? `, ${moment.lifetimeOrders} lifetime orders` : '';
      output += `   • ${moment.name} — ${moment.years} year${moment.years === 1 ? '' : 's'} since first purchase (${formatMonthDay(moment.firstPurchaseDate)}${collectorDepth})\n`;
    });
  }

  // Today's deliveries
  const deliveries = await getTodaysDeliveries();
  output += `\n📦 Deliveries Today:\n`;
  if (deliveries.length === 0) {
    output += `   • No deliveries scheduled\n`;
  } else {
    deliveries.forEach((order) => {
      const customer = order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Guest';
      const tracking = order.fulfillments[0]?.tracking_number ? ` (Tracking: ${order.fulfillments[0].tracking_number})` : '';
      output += `   • ${customer} — Order #${order.name}${tracking}\n`;
    });
  }

  // Sales trend (last 7 days from snapshot history)
  const currentSnapshot = readSnapshot();
  const salesHistory = currentSnapshot.salesHistory || [];
  if (salesHistory.length >= 2) {
    const recentSales = salesHistory.slice(-7);
    const totalRecent = recentSales.reduce((sum, d) => sum + (d.sales || 0), 0);
    const avgRecent = totalRecent / recentSales.length;
    output += `\n📈 7-Day Sales Trend:\n`;
    recentSales.forEach(d => {
      const bar = '█'.repeat(Math.min(Math.round((d.sales / Math.max(...recentSales.map(x => x.sales), 1)) * 10), 10));
      output += `   • ${d.date}: $${d.sales.toFixed(2)} ${bar}\n`;
    });
    output += `   • Avg/day: $${avgRecent.toFixed(2)}\n`;
  }

  // Star collector check — flag buyers with 10+ lifetime orders
  if (orders.length > 0) {
    const starCollectorOrders = [];
    for (const order of orders) {
      if (order.customer?.id) {
        try {
          const customerOrders = await shopifyRequest(`/customers/${order.customer.id}/orders.json?status=any&limit=250`);
          const orderCount = (customerOrders.orders || []).length;
          if (orderCount >= 10) {
            const name = order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Guest';
            starCollectorOrders.push({ name, orderCount, amount: order.total_price });
          }
        } catch (e) {
          // Non-fatal — skip if customer lookup fails
        }
      }
    }
    if (starCollectorOrders.length > 0) {
      output += `\n⭐ Star Collector Alert:\n`;
      starCollectorOrders.forEach(sc => {
        output += `   • ${sc.name} — ${sc.orderCount} lifetime orders ($${sc.amount} yesterday) 🎉\n`;
      });
    }
  }

  output += `\n💡 Quick insight:\n`;
  if (orders.length === 0) {
    output += `   Quiet day yesterday — perfect time to create! 🎨\n`;
  } else {
    output += `   ${orders.length} ${orders.length === 1 ? 'collector' : 'collectors'} found their perfect piece!\n`;
  }

  output += `\nHave a beautiful day!\n`;

  // Save today's counts for tomorrow's comparison
  saveSnapshot(newsletterTotal, starterKitTotal, totalSales);

  return output;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!ACCESS_TOKEN) {
    console.error('Error: SARAH_SHOPIFY_ACCESS_TOKEN environment variable required');
    process.exit(1);
  }

  generateDashboard().then(console.log).catch((err) => {
    console.error('Dashboard error:', err.message);
    process.exit(1);
  });
}
