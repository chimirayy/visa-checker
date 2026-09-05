let countries=[], nationalities=[], rules=[], transit=false;
const $=id=>document.getElementById(id);

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
function flag(code){
  if(!code || code.length!==2) return "";
  return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt()));
}
function countryName(code){
  return countries.find(c=>c.code===code)?.name || code;
}
function nationalityName(code){
  return nationalities.find(c=>c.code===code)?.name || code;
}
function fillSelect(el, items, placeholder){
  el.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(x=>`<option value="${x.code}">${flag(x.code)} ${esc(x.name)}</option>`).join("");
}

async function load(){
  [countries,nationalities,rules]=await Promise.all([
    fetch("data/countries.json").then(r=>r.json()),
    fetch("data/nationalities.json").then(r=>r.json()),
    fetch("data/entry-rules.json").then(r=>r.json())
  ]);
  fillSelect($("nationality"),nationalities,"Choose nationality");
  fillSelect($("destination"),countries,"Choose destination");
  fillSelect($("transitCountry"),countries,"Choose transit country");
}

document.querySelectorAll("[data-transit]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-transit]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    transit = btn.dataset.transit === "yes";
    $("transitPanel").classList.toggle("hidden", !transit);
  });
});

$("checkBtn").addEventListener("click",()=>{
  const nationality=$("nationality").value;
  const destination=$("destination").value;
  if(!nationality || !destination){
    alert("Please select both nationality and destination.");
    return;
  }
  const rule=rules.find(r=>r.nationality===nationality && r.destination===destination);
  renderResult(nationality,destination,rule);
});

function fallbackRule(nationality,destination){
  return {
    nationality,destination,
    visa:{status:"unverified",label:"Rule not yet verified",maximum_stay_days:null},
    passport:{
      required:null,
      validity_display:"No verified rule in the starter dataset.",
      blank_pages:"Not verified",
      accepted_documents:[]
    },
    documents:[],
    conditions:[
      "This nationality/destination combination exists in the UI, but a verified rule has not yet been added.",
      "Add an official source record to data/entry-rules.json before production use."
    ],
    source:{
      name:"No verified rule stored",
      url:"https://www.iata.org/en/services/compliance/timatic/",
      last_verified:"—",
      confidence:"Unverified"
    }
  };
}

function renderResult(n,d,rule){
  const r=rule || fallbackRule(n,d);
  const passportRequired = r.passport.required===true ? "Yes" : r.passport.required===false ? "No" : "Not verified";
  const accepted = r.passport.accepted_documents?.length
    ? `<ul class="accepted-list">${r.passport.accepted_documents.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`
    : `<span class="value">Not verified</span>`;
  const docs = r.documents?.length
    ? r.documents.map(x=>`<div class="doc-row"><span>${esc(x.label)}</span><span class="badge">${esc(x.status)}</span></div>`).join("")
    : `<p class="source">No supporting-document rule has been verified for this record yet.</p>`;

  let html = `
    <div class="result-hero">
      <div class="route">${flag(n)} ${esc(nationalityName(n))} → ${flag(d)} ${esc(countryName(d))} • AIR TRAVEL</div>
      <h2>Destination entry requirements</h2>
      <span class="status">${esc(r.visa.label)}</span>
    </div>
    <div class="result-grid">
      <div class="result-card">
        <h3>Passport / travel document</h3>
        <div class="kv"><span>Passport mandatory</span><span class="value">${passportRequired}</span></div>
        <div class="kv"><span>Minimum validity</span><span class="value">${esc(r.passport.validity_display)}</span></div>
        <div class="kv"><span>Blank pages</span><span class="value">${esc(r.passport.blank_pages)}</span></div>
      </div>
      <div class="result-card">
        <h3>Accepted identity / travel documents</h3>
        ${accepted}
      </div>
      <div class="result-card">
        <h3>Other documents</h3>
        ${docs}
      </div>
      <div class="result-card">
        <h3>Source & verification</h3>
        <p class="source">
          ${esc(r.source.name)}<br>
          Last verified: ${esc(r.source.last_verified)}<br>
          Status: ${esc(r.source.confidence)}<br>
          <a href="${esc(r.source.url)}" target="_blank" rel="noopener">Open source →</a>
        </p>
      </div>
      <div class="result-card" style="grid-column:1/-1">
        <h3>Conditions</h3>
        <ul class="accepted-list">${(r.conditions||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      </div>
    </div>`;

  if(transit){
    const tc=$("transitCountry").value;
    html += `
      <div class="result-card transit-card">
        <h3>Transit check</h3>
        <div class="kv"><span>Transit country</span><span class="value">${tc ? `${flag(tc)} ${esc(countryName(tc))}` : "Not selected"}</span></div>
        <div class="kv"><span>Remain airside</span><span class="value">${esc($("airside").value)}</span></div>
        <div class="kv"><span>Change airports</span><span class="value">${esc($("airportChange").value)}</span></div>
        <div class="kv"><span>Collect / re-check baggage</span><span class="value">${esc($("baggage").value)}</span></div>
        <div class="notice">
          Transit rules are highly itinerary-specific. This starter build intentionally does not invent transit exemptions.
          Add verified transit records to <strong>data/transit-rules.json</strong> before production use.
        </div>
      </div>`;
  }

  html += `
    <div class="notice">
      This site is fully deployable, but the bundled database is a starter dataset, not a live legal or immigration decision service.
      Visa, transit and passport rules change frequently. Replace or expand the JSON records with verified official sources before public production use.
    </div>`;

  $("results").innerHTML=html;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

load().catch(err=>{
  console.error(err);
  $("results").innerHTML=`<div class="notice">Could not load local JSON data. Open the site through GitHub Pages or a local web server rather than directly as a file.</div>`;
  $("results").classList.remove("hidden");
});
