-- 0006_meeting_crm_crosslink.sql
-- Cross-link meeting_reviews.attendees → crm_objects (contacts) by email.
--
-- A single view supports both directions of the join:
--   1. "Who from CRM was on this meeting?"
--      select * from meeting_review_contacts where granola_meeting_id = $1
--   2. "Which meetings has this contact been in?"
--      select * from meeting_review_contacts where crm_object_id = $1
--
-- Email match is case-insensitive (lower()-on-both-sides). Rows where the
-- attendee email doesn't match a mirrored CRM contact return crm_object_id =
-- NULL — useful for showing "external attendee" chips in the dashboard.
--
-- v1 scope: contacts only. Deals can be reached via contact → HubSpot
-- associations in a follow-up join, but that requires the associations table
-- to be mirrored first (Phase 2.x of CRM mirror).

create or replace view public.meeting_review_contacts as
select
    mr.id                              as review_id,
    mr.granola_meeting_id              as granola_meeting_id,
    mr.meeting_started_at              as meeting_started_at,
    mr.meeting_ended_at                as meeting_ended_at,
    mr.status                          as review_status,
    attendee->>'name'                  as attendee_name,
    attendee->>'email'                 as attendee_email,
    attendee->>'granola_user_id'       as attendee_granola_user_id,
    co.id                              as crm_object_id,
    co.hs_object_type                  as crm_object_type,
    co.hs_object_id                    as crm_hs_object_id,
    co.properties                      as crm_properties
from public.meeting_reviews mr
cross join lateral jsonb_array_elements(mr.attendees) as attendee
left join public.crm_objects co
    on co.hs_object_type = 'contact'
    and co.properties->>'email' is not null
    and lower(co.properties->>'email') = lower(attendee->>'email')
where attendee->>'email' is not null;

-- Anon role can SELECT the view (mirrors the read policy on both source tables).
-- Views inherit RLS from underlying tables; both meeting_reviews and crm_objects
-- already have anon SELECT policies, so no extra policy is needed.

-- Indexing: the join is on lower(email) on both sides. Add a functional index
-- on crm_objects to keep "meetings for this contact" queries fast as the CRM
-- mirror grows.
create index if not exists crm_objects_email_lower_idx
    on public.crm_objects ((lower(properties->>'email')))
    where hs_object_type = 'contact' and properties->>'email' is not null;

comment on view public.meeting_review_contacts is
    'Cross-link of meeting_reviews.attendees to crm_objects (contacts) by email. '
    'Use granola_meeting_id filter for "who was on this meeting" or crm_object_id '
    'for "meetings with this contact". Phase 2 dashboard surface.';
