const http = require('http');
const { URL } = require('url');
const fs = require('fs');

const PORT = 18795;
const PREFIX = '/backend-api/claude-code';
const token = fs.readFileSync('/tmp/anthropic_oauth_token.txt','utf8').replace(/\s+/g,'');
let connected = false;
const sessions = new Map();

function send(res, code, obj, extra={}) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json', ...extra });
  res.end(body);
}
async function readJson(req) {
  return await new Promise((resolve,reject)=>{
    let d='';
    req.on('data', c => d += c);
    req.on('end', ()=>{
      if (!d) return resolve({});
      try { resolve(JSON.parse(d)); } catch(e){ reject(e); }
    });
    req.on('error', reject);
  });
}
async function anthropicMessage(prompt) {
  const body={
    model:'claude-sonnet-4-20250514',
    max_tokens:256,
    messages:[{role:'user',content:prompt}],
    system:[{type:'text',text:"You are Claude Code, Anthropic's official CLI for Claude."}]
  };
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'content-type':'application/json',
      'accept':'application/json',
      'authorization':`Bearer ${token}`,
      'anthropic-version':'2023-06-01',
      'anthropic-beta':'claude-code-20250219,oauth-2025-04-20,fine-grained-tool-streaming-2025-05-14',
      'user-agent':'claude-cli/2.1.75',
      'x-app':'cli'
    },
    body: JSON.stringify(body)
  });
  const text=await res.text();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${text.slice(0,500)}`);
  const data=JSON.parse(text);
  const reply=(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
  return {data, reply};
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (!url.pathname.startsWith(PREFIX)) return send(res,404,{ok:false,error:'Not found'});
  const path = url.pathname.slice(PREFIX.length);
  try {
    if (req.method==='POST' && path==='/connect') {
      connected = true;
      return send(res,200,{ok:true,status:'connected',server:{type:'oauth-anthropic-shim'},tools:3});
    }
    if (req.method==='POST' && path==='/disconnect') {
      connected = false;
      return send(res,200,{ok:true});
    }
    if (req.method==='GET' && path==='/tools') {
      if (!connected) return send(res,200,{ok:false,error:'Not connected'});
      return send(res,200,{ok:true,tools:[
        {name:'session-start',description:'Start Claude OAuth session'},
        {name:'session-send',description:'Send prompt to Claude OAuth session'},
        {name:'session-status',description:'Session status'}
      ]});
    }
    if (req.method==='GET' && path==='/sessions') {
      return send(res,200,{ok:true,sessions:Array.from(sessions.values())});
    }
    if (req.method==='POST' && path==='/session/start') {
      if (!connected) return send(res,200,{ok:false,error:'Not connected'});
      const body = await readJson(req);
      const name = body.name || `session-${Date.now()}`;
      const rec = { name, cwd: body.cwd || process.cwd(), created: new Date().toISOString(), isReady: true, claudeSessionId: `oauth-${Date.now()}`, history: [] };
      sessions.set(name, rec);
      return send(res,200,{ok:true,claudeSessionId:rec.claudeSessionId});
    }
    if (req.method==='POST' && path==='/session/send') {
      if (!connected) return send(res,200,{ok:false,error:'Not connected'});
      const body = await readJson(req);
      const name = body.name;
      const sess = sessions.get(name);
      if (!sess) return send(res,200,{ok:false,error:`Unknown session: ${name}`});
      const {reply, data} = await anthropicMessage(body.message);
      sess.lastActivity = new Date().toISOString();
      sess.turns = (sess.turns||0)+1;
      sess.tokensIn = (sess.tokensIn||0) + (data.usage?.input_tokens||0);
      sess.tokensOut = (sess.tokensOut||0) + (data.usage?.output_tokens||0);
      sess.history.push({role:'user', text: body.message, time: sess.lastActivity});
      sess.history.push({role:'assistant', text: reply, time: sess.lastActivity});
      return send(res,200,{ok:true,response:reply});
    }
    if (req.method==='POST' && path==='/session/status') {
      const body = await readJson(req);
      const sess = sessions.get(body.name);
      if (!sess) return send(res,200,{ok:false,error:`Unknown session: ${body.name}`});
      return send(res,200,{ok:true,claudeSessionId:sess.claudeSessionId,cwd:sess.cwd,created:sess.created,stats:{turns:sess.turns||0,toolCalls:0,tokensIn:sess.tokensIn||0,tokensOut:sess.tokensOut||0,uptime:Math.floor((Date.now()-new Date(sess.created).getTime())/1000),lastActivity:sess.lastActivity||sess.created,isReady:true}});
    }
    return send(res,404,{ok:false,error:`Unhandled ${req.method} ${path}`});
  } catch (e) {
    return send(res,200,{ok:false,error:String(e.message||e)});
  }
});
server.listen(PORT,'127.0.0.1',()=>console.log(`shim listening on ${PORT}`));
