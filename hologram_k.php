<?php
declare(strict_types=1);

/**
 * ONE-FILE HOLOGRAM + AI VOICE PAGE (PHP)
 * Features:
 * - Upload GLB/GLTF to /uploads
 * - List & load models
 * - 3D viewer (Three.js via CDN + importmap)
 * - Chat (server -> OpenAI)
 * - TTS (server -> OpenAI audio/speech)  :contentReference[oaicite:1]{index=1}
 * - STT (server -> OpenAI audio/transcriptions) :contentReference[oaicite:2]{index=2}
 * - Simple lipsync (volume-driven morph target if present)
 *
 * SECURITY:
 * - API key stays on server only
 * - uploads: random names; extension allowlist; size limit
 */

//// ---------- CONFIG ----------
$UPLOAD_DIR = __DIR__ . '/uploads';
$UPLOAD_URL = 'uploads'; // relative
$MAX_MB     = 60;
$ALLOW_EXT  = ['glb','gltf'];

$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: ''; // keep server-side

// Choose models (can be changed later)
$CHAT_MODEL = 'gpt-4o-mini';
$STT_MODEL  = 'gpt-4o-mini-transcribe';
$TTS_MODEL  = 'gpt-4o-mini-tts';
$TTS_VOICE  = 'onyx'; // masculine voice (you can change to alloy/echo/etc.) :contentReference[oaicite:3]{index=3}

//// ---------- HELPERS ----------
function jout(array $data, int $code=200): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function ensure_dir(string $dir): void {
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
}
function safe_no_traversal(string $s): bool {
  return $s !== '' && !str_contains($s,'..') && !str_contains($s,"\0") && preg_match('/^[a-f0-9]{32}\.(glb|gltf)$/', $s);
}
function http_post_json(string $url, array $payload, array $headers=[]): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 120,
  ]);
  $resp = curl_exec($ch);
  $err  = curl_error($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) return ['ok'=>false,'code'=>0,'error'=>$err ?: 'cURL error'];
  $json = json_decode($resp, true);
  if (!is_array($json)) return ['ok'=>false,'code'=>$code,'error'=>'Non-JSON response', 'raw'=>$resp];
  return ['ok'=>($code>=200 && $code<300), 'code'=>$code, 'json'=>$json];
}
function http_post_multipart(string $url, array $fields, array $headers=[]): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => $fields,
    CURLOPT_TIMEOUT => 180,
  ]);
  $resp = curl_exec($ch);
  $err  = curl_error($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($resp === false) return ['ok'=>false,'code'=>0,'error'=>$err ?: 'cURL error'];
  $json = json_decode($resp, true);
  if (!is_array($json)) return ['ok'=>false,'code'=>$code,'error'=>'Non-JSON response', 'raw'=>$resp];
  return ['ok'=>($code>=200 && $code<300), 'code'=>$code, 'json'=>$json];
}

//// ---------- API ROUTES (same file) ----------
$action = $_GET['action'] ?? '';

ensure_dir($UPLOAD_DIR);

if ($action === 'list') {
  $items = [];
  foreach (glob($UPLOAD_DIR . '/*.{glb,gltf}', GLOB_BRACE) as $p) {
    $bn = basename($p);
    if (!safe_no_traversal($bn)) continue;
    $items[] = [
      'file' => $bn,
      'url'  => $UPLOAD_URL . '/' . rawurlencode($bn),
      'time' => gmdate('Y-m-d H:i:s', (int)filemtime($p)) . ' UTC',
      'size' => filesize($p),
    ];
  }
  usort($items, fn($a,$b) => strcmp($b['time'],$a['time']));
  jout(['ok'=>true,'items'=>$items, 'has_key'=>($OPENAI_API_KEY !== '')]);
}

if ($action === 'upload') {
  if (!isset($_FILES['model'])) jout(['ok'=>false,'error'=>'Missing file'], 400);
  $f = $_FILES['model'];
  if (!empty($f['error'])) jout(['ok'=>false,'error'=>'Upload error: '.$f['error']], 400);
  $size = (int)($f['size'] ?? 0);
  if ($size <= 0) jout(['ok'=>false,'error'=>'Empty file'], 400);
  if ($size > $MAX_MB * 1024 * 1024) jout(['ok'=>false,'error'=>"File too large (max {$MAX_MB}MB)"], 413);

  $orig = (string)($f['name'] ?? 'model.glb');
  $ext  = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
  if (!in_array($ext, $ALLOW_EXT, true)) jout(['ok'=>false,'error'=>'Only .glb/.gltf allowed'], 415);

  $name = bin2hex(random_bytes(16)) . '.' . $ext;
  $dest = $UPLOAD_DIR . '/' . $name;
  if (!move_uploaded_file($f['tmp_name'], $dest)) jout(['ok'=>false,'error'=>'Could not save file'], 500);

  jout(['ok'=>true,'file'=>$name,'url'=>$UPLOAD_URL.'/'.rawurlencode($name)]);
}

if ($action === 'chat') {
  if ($OPENAI_API_KEY === '') jout(['ok'=>false,'error'=>'OPENAI_API_KEY not set on server'], 500);

  $raw = file_get_contents('php://input');
  $body = json_decode($raw ?: '', true);
  $text = trim((string)($body['text'] ?? ''));
  if ($text === '') jout(['ok'=>false,'error'=>'Empty message'], 400);

  // Use Responses API (simple)
  // Docs: API reference intro (auth), models, etc. :contentReference[oaicite:4]{index=4}
  $payload = [
    'model' => $CHAT_MODEL,
    'input' => [
      ['role'=>'system','content'=>[
        ['type'=>'text','text'=>"You are a helpful voice assistant embedded in a 3D avatar page. Keep answers concise and natural. Reply in the same language as the user."]
      ]],
      ['role'=>'user','content'=>[
        ['type'=>'text','text'=>$text]
      ]]
    ],
  ];

  $res = http_post_json(
    'https://api.openai.com/v1/responses',
    $payload,
    ['Authorization: Bearer ' . $OPENAI_API_KEY]
  );

  if (!$res['ok']) {
    $msg = $res['json']['error']['message'] ?? $res['error'] ?? 'OpenAI error';
    jout(['ok'=>false,'error'=>$msg,'status'=>$res['code']], 502);
  }

  // Extract text
  $outText = '';
  $json = $res['json'];
  if (isset($json['output']) && is_array($json['output'])) {
    foreach ($json['output'] as $item) {
      if (($item['type'] ?? '') === 'message' && isset($item['content']) && is_array($item['content'])) {
        foreach ($item['content'] as $c) {
          if (($c['type'] ?? '') === 'output_text') $outText .= (string)($c['text'] ?? '');
        }
      }
    }
  }
  $outText = trim($outText);
  if ($outText === '') $outText = '(no text)';

  jout(['ok'=>true,'text'=>$outText]);
}

if ($action === 'tts') {
  if ($OPENAI_API_KEY === '') jout(['ok'=>false,'error'=>'OPENAI_API_KEY not set on server'], 500);

  $raw = file_get_contents('php://input');
  $body = json_decode($raw ?: '', true);
  $text = trim((string)($body['text'] ?? ''));
  if ($text === '') jout(['ok'=>false,'error'=>'Empty text'], 400);

  // Audio API speech: returns audio bytes (mp3/wav). :contentReference[oaicite:5]{index=5}
  $payload = [
    'model' => $TTS_MODEL,
    'voice' => $TTS_VOICE,
    'format'=> 'mp3',
    'input' => $text,
  ];

  $ch = curl_init('https://api.openai.com/v1/audio/speech');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $OPENAI_API_KEY,
      'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 180,
  ]);
  $audio = curl_exec($ch);
  $err   = curl_error($ch);
  $code  = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $ctype = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
  curl_close($ch);

  if ($audio === false || $code < 200 || $code >= 300) {
    // try parse json error
    $j = json_decode((string)$audio, true);
    $msg = $j['error']['message'] ?? ($err ?: 'TTS error');
    jout(['ok'=>false,'error'=>$msg,'status'=>$code,'content_type'=>$ctype], 502);
  }

  // Return as base64 to browser
  jout(['ok'=>true,'audio_b64'=>base64_encode($audio), 'mime'=>'audio/mpeg']);
}

if ($action === 'stt') {
  if ($OPENAI_API_KEY === '') jout(['ok'=>false,'error'=>'OPENAI_API_KEY not set on server'], 500);

  if (!isset($_FILES['audio'])) jout(['ok'=>false,'error'=>'Missing audio'], 400);
  $f = $_FILES['audio'];
  if (!empty($f['error'])) jout(['ok'=>false,'error'=>'Upload error: '.$f['error']], 400);

  $tmp = $f['tmp_name'];
  $orig= (string)($f['name'] ?? 'audio.webm');

  // Audio transcription endpoint :contentReference[oaicite:6]{index=6}
  $fields = [
    'model' => $STT_MODEL,
    'file'  => new CURLFile($tmp, mime_content_type($tmp) ?: 'application/octet-stream', $orig),
  ];

  $res = http_post_multipart(
    'https://api.openai.com/v1/audio/transcriptions',
    $fields,
    ['Authorization: Bearer ' . $OPENAI_API_KEY]
  );

  if (!$res['ok']) {
    $msg = $res['json']['error']['message'] ?? $res['error'] ?? 'STT error';
    jout(['ok'=>false,'error'=>$msg,'status'=>$res['code']], 502);
  }

  $text = (string)($res['json']['text'] ?? '');
  jout(['ok'=>true,'text'=>$text]);
}

// ---------- PAGE (no action) ----------
?>
<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Hologram Full (1 page)</title>
<style>
  html,body{margin:0;height:100%;background:#070a0d;color:#e8f6ff;font-family:system-ui}
  .wrap{display:grid;grid-template-columns: 1.4fr 0.9fr; gap:12px; height:100%; padding:12px; box-sizing:border-box}
  .card{background:#0e151a;border:1px solid rgba(160,255,255,.12);border-radius:14px;overflow:hidden}
  #view{position:relative}
  #hud{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;z-index:10}
  .pill{background:rgba(0,30,45,.55);border:1px solid rgba(160,255,255,.18);padding:8px 10px;border-radius:12px;font-size:13px}
  .btn{cursor:pointer;background:#0c2430;border:1px solid rgba(160,255,255,.20);color:#bff;padding:10px 12px;border-radius:12px}
  .btn:hover{background:#103646}
  .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .right{display:flex;flex-direction:column}
  .pane{padding:12px}
  input[type=file],input[type=text],textarea,select{
    background:#0a1116;border:1px solid rgba(160,255,255,.12);color:#e8f6ff;border-radius:12px;padding:10px 12px;
  }
  textarea{width:100%;min-height:120px;resize:vertical}
  #chatlog{height:calc(100vh - 380px);overflow:auto;padding:12px;box-sizing:border-box}
  .msg{padding:10px 12px;border-radius:12px;margin-bottom:10px;border:1px solid rgba(160,255,255,.10);background:#0a1116}
  .me{border-color:rgba(126,255,255,.22)}
  .ai{border-color:rgba(255,255,255,.12)}
  .small{opacity:.85;font-size:12px}
  .warn{color:#ffcc66}
</style>

<!-- Importmap fix for Three.js bare imports -->
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
</head>
<body>

<div class="wrap">

  <!-- LEFT: 3D VIEW -->
  <div class="card" id="view">
    <div id="hud">
      <div class="pill" id="status">Ready</div>
      <button class="btn" id="btnReset">Reset view</button>
      <button class="btn" id="btnOpenLocal">Open local GLB…</button>
      <label class="pill row" style="gap:6px">
        Lipsync
        <select id="lipsyncMode">
          <option value="off">OFF</option>
          <option value="on" selected>ON (volume)</option>
        </select>
      </label>
      <label class="pill row" style="gap:6px">
        TTS
        <select id="ttsMode">
          <option value="openai" selected>OpenAI (server)</option>
          <option value="browser">Browser voice</option>
          <option value="off">OFF</option>
        </select>
      </label>
      <div class="pill small" id="keyInfo"></div>
    </div>
    <!-- renderer canvas is injected here -->
  </div>

  <!-- RIGHT: CONTROLS -->
  <div class="right">

    <div class="card pane">
      <h3 style="margin:0 0 10px 0">1) Upload model (server)</h3>
      <form id="uploadForm" class="row">
        <input type="file" name="model" accept=".glb,.gltf" required>
        <button class="btn" type="submit">Upload</button>
      </form>
      <div class="row" style="margin-top:10px">
        <button class="btn" id="btnRefresh" type="button">Refresh list</button>
        <select id="modelList" style="min-width:260px"></select>
        <button class="btn" id="btnLoadServer" type="button">Load</button>
      </div>
      <div class="small" style="margin-top:8px;opacity:.9">
        Tip: poți încărca și local (Open local GLB…) fără upload.
      </div>
    </div>

    <div class="card">
      <div class="pane">
        <h3 style="margin:0 0 10px 0">2) AI Chat + Voice</h3>
        <div class="row">
          <button class="btn" id="btnMic">🎤 Push-to-talk</button>
          <span class="small" id="micState">Mic idle</span>
        </div>
      </div>
      <div id="chatlog"></div>
      <div class="pane">
        <div class="row" style="gap:10px">
          <input id="chatInput" type="text" placeholder="Scrie aici…" style="flex:1 1 auto; min-width:220px">
          <button class="btn" id="btnSend" type="button">Send</button>
        </div>
        <div class="small warn" id="warn"></div>
      </div>
    </div>

  </div>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (id)=>document.getElementById(id);
const statusEl = $('status');
const warnEl = $('warn');
const setStatus = (t)=> statusEl.textContent = t;
const setWarn = (t)=> warnEl.textContent = t || '';

function addMsg(role, text){
  const box = document.createElement('div');
  box.className = 'msg ' + (role === 'me' ? 'me' : 'ai');
  box.textContent = (role === 'me' ? 'You: ' : 'AI: ') + text;
  $('chatlog').appendChild(box);
  $('chatlog').scrollTop = $('chatlog').scrollHeight;
}

async function api(action, options){
  const res = await fetch(`?action=${encodeURIComponent(action)}`, options);
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { throw new Error('Server returned invalid JSON: ' + txt); }
  if(!res.ok || json.ok === false) throw new Error(json.error || 'API error');
  return json;
}

// ---------- 3D Viewer ----------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 20);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 200);
camera.position.set(0, 1.2, 3);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
$('view').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0x66ccff, 0x00111a, 1.2));
const rim = new THREE.DirectionalLight(0x88e6ff, 1.5);
rim.position.set(2,3,2);
scene.add(rim);

const grid = new THREE.GridHelper(10, 40, 0x114455, 0x061b22);
grid.position.y = -0.01;
scene.add(grid);

const loader = new GLTFLoader();
let mixer = null;
let root = null;

// For lipsync
let lipTarget = null;        // { mesh, index }
let lipValue = 0;
let analyser = null;
let audioCtx = null;
let sourceNode = null;

function disposeModel(obj){
  if(!obj) return;
  obj.traverse(o=>{
    if(o.isMesh){
      if(o.geometry) o.geometry.dispose();
      const m = o.material;
      if(Array.isArray(m)) m.forEach(mm=>mm.dispose?.());
      else m?.dispose?.();
    }
  });
  scene.remove(obj);
}

function applyHolo(obj){
  obj.traverse(o=>{
    if(o.isMesh && o.material){
      o.material.transparent = true;
      o.material.opacity = 0.95;
      if('emissive' in o.material){
        o.material.emissive = new THREE.Color(0x1aa3ff);
        o.material.emissiveIntensity = 0.4;
      }
      o.material.depthWrite = false;
    }
  });
}

function fitCamera(object, offset=1.25){
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x,size.y,size.z);

  const fov = camera.fov * Math.PI / 180;
  let cameraZ = Math.abs(maxDim/2 / Math.tan(fov/2));
  cameraZ *= offset;

  camera.position.set(center.x, center.y + maxDim*0.15, center.z + cameraZ);
  camera.near = Math.max(0.01, cameraZ/100);
  camera.far = cameraZ*100;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

function findLipMorph(model){
  // Try to find a morph target that looks like mouth/jaw open
  const candidates = [
    'jawOpen','JawOpen','mouthOpen','MouthOpen','viseme_aa','viseme_AA','aa','AA',
    'vrc.v_aa','vrc.v_ah','Ah','ah'
  ];
  let found = null;

  model.traverse(o=>{
    if(found) return;
    if(o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences){
      for(const key of candidates){
        if(key in o.morphTargetDictionary){
          found = { mesh: o, index: o.morphTargetDictionary[key], name: key };
          return;
        }
      }
      // fallback: any morph that contains 'mouth' or 'jaw'
      for(const [name, idx] of Object.entries(o.morphTargetDictionary)){
        const n = name.toLowerCase();
        if(n.includes('mouth') || n.includes('jaw')){
          found = { mesh: o, index: idx, name };
          return;
        }
      }
    }
  });

  return found;
}

function loadModel(url, label='model'){
  setStatus(`Loading ${label}…`);
  setWarn('');

  loader.load(url, (gltf)=>{
    if(mixer) mixer.stopAllAction();
    mixer = null;
    disposeModel(root);

    root = gltf.scene;
    applyHolo(root);
    scene.add(root);

    if(gltf.animations?.length){
      mixer = new THREE.AnimationMixer(root);
      gltf.animations.forEach(a=>mixer.clipAction(a).play());
      setStatus(`Loaded ${label} • Animations: ${gltf.animations.length}`);
    }else{
      setStatus(`Loaded ${label} • No animations`);
    }

    fitCamera(root);

    lipTarget = findLipMorph(root);
    if(lipTarget){
      setStatus(statusEl.textContent + ` • Lip: ${lipTarget.name}`);
    }else{
      setWarn('Lipsync: modelul nu are morph target clar pentru gură (jawOpen/mouthOpen/viseme). Se va reda vocea, dar gura poate să nu se miște.');
    }

  }, (evt)=>{
    if(evt.total){
      const pct = Math.round(evt.loaded/evt.total*100);
      setStatus(`Loading ${label}… ${pct}%`);
    }
  }, (err)=>{
    console.error(err);
    setStatus(`Failed to load ${label}`);
    setWarn('Dacă ai pus fișierul pe server, verifică că URL-ul e corect. Dacă e local, folosește butonul Open local GLB…');
  });
}

$('btnReset').onclick = ()=> {
  if(root) fitCamera(root);
  else {
    camera.position.set(0,1.2,3);
    controls.target.set(0,0.9,0);
    controls.update();
  }
  setStatus('View reset');
};

// Local model picker (no upload)
$('btnOpenLocal').onclick = async ()=>{
  try{
    if(window.showOpenFilePicker){
      const [h] = await window.showOpenFilePicker({
        multiple:false,
        types:[{ description:'3D Models', accept:{ 'model/gltf-binary':['.glb'], 'model/gltf+json':['.gltf'] } }]
      });
      const f = await h.getFile();
      const url = URL.createObjectURL(f);
      loadModel(url, f.name);
      return;
    }
  }catch(e){}
  const input = document.createElement('input');
  input.type='file'; input.accept='.glb,.gltf';
  input.onchange = ()=>{
    const f = input.files?.[0];
    if(!f) return;
    loadModel(URL.createObjectURL(f), f.name);
  };
  input.click();
};

// ---------- Server model list ----------
async function refreshList(){
  const data = await api('list');
  $('keyInfo').textContent = data.has_key ? 'OpenAI: OK' : 'OpenAI: NO KEY (browser fallback only)';
  const sel = $('modelList');
  sel.innerHTML = '';
  if(!data.items.length){
    const opt = document.createElement('option');
    opt.value=''; opt.textContent='(no models on server)';
    sel.appendChild(opt);
    return;
  }
  for(const it of data.items){
    const opt = document.createElement('option');
    opt.value = it.url;
    opt.textContent = `${it.file} • ${Math.round(it.size/1024)} KB • ${it.time}`;
    sel.appendChild(opt);
  }
}
$('btnRefresh').onclick = refreshList;
$('btnLoadServer').onclick = ()=>{
  const url = $('modelList').value;
  if(!url) return;
  loadModel(url, 'server model');
};

$('uploadForm').onsubmit = async (ev)=>{
  ev.preventDefault();
  const fd = new FormData(ev.target);
  setStatus('Uploading…');
  try{
    const res = await api('upload', { method:'POST', body: fd });
    setStatus('Uploaded');
    await refreshList();
    // auto-load uploaded
    loadModel(res.url, 'uploaded model');
    ev.target.reset();
  }catch(e){
    setStatus('Upload failed');
    setWarn(e.message);
  }
};

// ---------- Audio playback + lipsync analyser ----------
async function setupAnalyserForAudioElement(audioEl){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(sourceNode) { try{ sourceNode.disconnect(); }catch{} }
  sourceNode = audioCtx.createMediaElementSource(audioEl);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function updateLipsync(){
  if($('lipsyncMode').value !== 'on') return;
  if(!lipTarget || !analyser) return;

  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(buf);

  // RMS amplitude 0..1
  let sum = 0;
  for(let i=0;i<buf.length;i++){
    const v = (buf[i]-128)/128;
    sum += v*v;
  }
  const rms = Math.sqrt(sum / buf.length);

  // Smooth
  lipValue = lipValue * 0.85 + rms * 0.15;

  // Drive morph influence (clamp)
  const v = Math.min(1, Math.max(0, lipValue * 3.0)); // boost
  const mesh = lipTarget.mesh;
  mesh.morphTargetInfluences[lipTarget.index] = v;
}

// ---------- TTS ----------
async function speak(text){
  const mode = $('ttsMode').value;
  if(mode === 'off') return;

  // stop any ongoing browser speech
  try{ speechSynthesis.cancel(); }catch{}

  if(mode === 'browser'){
    // fallback: browser TTS
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ro-RO';
    u.rate = 1.0;
    speechSynthesis.speak(u);
    return;
  }

  // OpenAI TTS via server (returns base64 mp3)
  setStatus('TTS…');
  const data = await api('tts', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });

  const bytes = Uint8Array.from(atob(data.audio_b64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: data.mime || 'audio/mpeg' });
  const url = URL.createObjectURL(blob);

  const audio = new Audio(url);
  audio.onended = ()=> {
    setStatus('Ready');
    // reset mouth
    if(lipTarget?.mesh?.morphTargetInfluences) lipTarget.mesh.morphTargetInfluences[lipTarget.index] = 0;
  };

  await audio.play();
  await setupAnalyserForAudioElement(audio);
  setStatus('Speaking…');
}

// ---------- Chat ----------
async function sendChat(text){
  addMsg('me', text);
  setStatus('Thinking…');
  try{
    const data = await api('chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text })
    });
    addMsg('ai', data.text);
    setStatus('Ready');
    await speak(data.text);
  }catch(e){
    setStatus('Error');
    setWarn(e.message + ' (Dacă nu ai setat OPENAI_API_KEY pe server, comută TTS pe Browser și folosește doar viewer-ul.)');
  }
}

$('btnSend').onclick = ()=>{
  const t = $('chatInput').value.trim();
  if(!t) return;
  $('chatInput').value='';
  sendChat(t);
};
$('chatInput').addEventListener('keydown', (e)=>{
  if(e.key==='Enter'){ e.preventDefault(); $('btnSend').click(); }
});

// ---------- Microphone (Push-to-talk) ----------
let mediaRec = null;
let chunks = [];
let isRec = false;

async function startRec(){
  if(isRec) return;
  setWarn('');
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    chunks = [];
    mediaRec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mediaRec.ondataavailable = (e)=> { if(e.data.size) chunks.push(e.data); };
    mediaRec.onstop = async ()=>{
      // stop tracks
      stream.getTracks().forEach(t=>t.stop());
      const blob = new Blob(chunks, { type: 'audio/webm' });
      $('micState').textContent = 'Transcribing…';

      // send to server STT
      const fd = new FormData();
      fd.append('audio', blob, 'mic.webm');

      try{
        const res = await api('stt', { method:'POST', body: fd });
        $('micState').textContent = 'Mic idle';
        const text = (res.text || '').trim();
        if(text){
          $('chatInput').value = text;
          $('btnSend').click();
        }else{
          setWarn('Nu am înțeles ce ai spus.');
        }
      }catch(e){
        $('micState').textContent = 'Mic idle';
        setWarn(e.message);
      }
    };
    mediaRec.start();
    isRec = true;
    $('micState').textContent = 'Recording… (ține apăsat)';
  }catch(e){
    setWarn('Nu pot porni microfonul: ' + e.message);
  }
}

function stopRec(){
  if(!isRec) return;
  isRec = false;
  $('micState').textContent = 'Stopping…';
  try{ mediaRec.stop(); }catch{}
}

const micBtn = $('btnMic');
micBtn.addEventListener('mousedown', startRec);
micBtn.addEventListener('mouseup', stopRec);
micBtn.addEventListener('mouseleave', ()=>{ if(isRec) stopRec(); });

// Touch support
micBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); startRec(); }, {passive:false});
micBtn.addEventListener('touchend', (e)=>{ e.preventDefault(); stopRec(); }, {passive:false});

// ---------- Render loop ----------
const clock = new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  if(mixer) mixer.update(dt);
  controls.update();
  updateLipsync();
  renderer.render(scene, camera);
}
loop();

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Boot
setStatus('Ready');
refreshList();
</script>

</body>
</html>
