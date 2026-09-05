let countries=[], nationalities=[], systems={}, destinationSources={}, transit=false;
const $=id=>document.getElementById(id);

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function flag(code){
  if(!code || code.length!==2 || code==="XK") return code==="XK" ? "🇽🇰" : "";
  return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt()));
}
function nameFor(code){ return countries.find(c=>c.code===code)?.name || code; }
function fillSelect(el, items, placeholder){
  el.innerHTML=`<option value="">${placeholder}</option>`+
    items.map(x=>`<option value="${x.code}">${flag(x.code)} ${esc(x.name)}</option>`).join("");
}
function has(arr, code){ return (arr||[]).includes(code); }

async function load(){
  [countries,nationalities,systems,destinationSources]=await Promise.all([
    fetch("data/countries.json").then(r=>r.json()),
    fetch("data/nationalities.json").then(r=>r.json()),
    fetch("data/rule-systems.json").then(r=>r.json()),
    fetch("data/destination-sources.json").then(r=>r.json())
  ]);
  fillSelect($("nationality"),nationalities,"Choose nationality");
  fillSelect($("destination"),countries,"Choose destination");
  fillSelect($("transitCountry"),countries,"Choose transit country");
}

document.querySelectorAll("[data-transit]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-transit]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    transit=btn.dataset.transit==="yes";
    $("transitPanel").classList.toggle("hidden",!transit);
  });
});

$("checkBtn").addEventListener("click",()=>{
  const n=$("nationality").value, d=$("destination").value;
  if(!n||!d){ alert("Please select both nationality and destination."); return; }
  render(n,d);
});

function schengenRule(n,d){
  const s=systems.schengen;
  if(!has(s.members,d)) return null;

  if(has(s.eu_eea_swiss,n)){
    return {
      label:"No visa required — free movement traveller",
      status:"visa_free",
      maxStay:"Free-movement rules apply; not the standard 90/180 visitor rule.",
      passportRequired:false,
      validity:s.passport_eu_eea_ch,
      accepted:["Valid passport","Valid national identity card (where applicable under free-movement rules)"],
      docs:[
        ["Visa","Not required"],
        ["Return / onward ticket","Normally not a visa condition"],
        ["Proof of funds","May still be relevant in exceptional border/control circumstances"]
      ],
      conditions:[
        "This result assumes the traveller is an EU/EEA/Swiss national using an accepted national passport or identity card.",
        "Special rules can apply to non-standard travel documents and to family members who are not themselves EU/EEA/Swiss nationals."
      ],
      source:s.source
    };
  }

  const conditional=has(s.conditional_passport_cases,n);
  const exempt=has(s.visa_exempt,n) || n==="TW" || n==="HK" || n==="MO";
  return {
    label: exempt ? (conditional ? "Visa-free only if passport/document conditions are met" : "Visa-free short stay") : "Schengen visa required",
    status: exempt ? "visa_free" : "visa_required",
    maxStay:s.max_stay,
    passportRequired:true,
    validity:s.passport_non_eu,
    accepted:["Valid passport / recognised travel document meeting Schengen validity rules"],
    docs:[
      ["Visa", exempt ? "Not required for qualifying short stay" : "Required before travel"],
      ["Return / onward ticket","May be requested"],
      ["Proof of accommodation","May be requested"],
      ["Proof of sufficient funds","May be requested"],
      ["Travel medical insurance", exempt ? "Not a universal border-entry document for visa-exempt travellers; check destination" : "Normally part of Schengen visa application requirements"]
    ],
    conditions:[
      "Short-stay calculation is generally 90 days in any 180-day period.",
      conditional ? "This nationality can have passport/document-specific limitations. Verify the exact passport type and biometric/document conditions before travel." : "Applies to an ordinary passport and a short tourism/visitor trip.",
      "Residence permits, long-stay visas, family-member rights and special-purpose travel can change the rule."
    ],
    source:s.source
  };
}

function ukRule(n){
  const u=systems.uk;
  if(n==="GB") return {
    label:"British citizen — no UK visa/ETA required",
    status:"visa_free",
    maxStay:"Right of entry depends on British citizenship/right of abode status.",
    passportRequired:true,
    validity:"Use a valid British passport or other accepted evidence of right of abode/citizenship.",
    accepted:["Valid British passport","Other accepted evidence of right of abode where applicable"],
    docs:[["Visa","Not required"],["ETA","Not required"]],
    conditions:["Assumes the traveller is a British citizen/right-of-abode holder."],
    source:u.source_entry
  };
  if(n==="IE") return {
    label:"Irish citizen — no UK visa/ETA required",
    status:"visa_free",
    maxStay:"Common Travel Area rights apply.",
    passportRequired:false,
    validity:"Carry valid acceptable proof of Irish nationality/identity; airlines may impose document requirements for boarding.",
    accepted:["Irish passport","Other carrier/route-accepted proof of identity where legally applicable"],
    docs:[["Visa","Not required"],["ETA","Not required"]],
    conditions:["Airlines may require a passport even where immigration law permits other identity evidence."],
    source:u.source_entry
  };
  if(has(u.eta_eligible,n)){
    return {
      label:"ETA required before travel",
      status:"eta",
      maxStay:"Visitor trips are normally up to 6 months, subject to UK Visitor rules.",
      passportRequired:true,
      validity:"Travel using the same valid passport linked to the ETA. Passport must remain valid for the journey/stay.",
      accepted:["Ordinary passport linked to the approved ETA"],
      docs:[["UK ETA","Required before travel unless an exemption applies"],["Visa","Not normally required for a standard visitor if ETA-eligible"],["Return / onward arrangements","May be requested"],["Proof of funds / purpose","May be requested"]],
      conditions:[
        "An ETA is permission to travel, not a guarantee of admission.",
        "A UK visa, UK immigration status or another statutory exemption can remove the ETA requirement."
      ],
      source:u.source_entry
    };
  }
  if(has(u.visa_nationals,n)){
    return {
      label:"UK visitor visa required before travel",
      status:"visa_required",
      maxStay:"Standard Visitor permission is usually for visits of up to 6 months, subject to the visa granted.",
      passportRequired:true,
      validity:"A valid passport or recognised travel document is required. It must be acceptable to UK authorities and the carrier.",
      accepted:["Valid passport / recognised travel document","UK-issued eVisa or other evidence of permission where applicable"],
      docs:[["UK visitor visa","Required before travel"],["Proof of visit purpose","Required/assessed"],["Proof of sufficient funds","Required/assessed"],["Return / onward arrangements","May be assessed"]],
      conditions:[
        "Exceptions exist for some passport types, statuses and specific schemes.",
        "This result assumes an ordinary passport and a standard short visitor trip."
      ],
      source:u.source_entry
    };
  }
  return {
    label:"Check UK permission before travel",
    status:"conditional",
    maxStay:"Depends on nationality, passport/status and purpose.",
    passportRequired:true,
    validity:"A valid recognised travel document is required.",
    accepted:["Valid recognised travel document"],
    docs:[["Visa / ETA","Check official UK service"]],
    conditions:["This country/territory is not mapped to the ordinary-passport ETA or visa-national lists in this static ruleset. Use the official checker."],
    source:u.source_entry
  };
}

function genericRule(n,d){
  const src=destinationSources[d] || {
    name:"IATA Timatic / destination immigration authority",
    url:"https://www.iata.org/en/services/compliance/timatic/",
    last_verified:"2026-09-05"
  };
  return {
    label:"Destination rule available for data expansion",
    status:"conditional",
    maxStay:"Not safely inferable from nationality alone in the current static dataset.",
    passportRequired:true,
    validity:"Check the official destination rule for exact validity (for example: validity for stay, 3 months after departure, or 6 months after arrival).",
    accepted:["Ordinary passport","Other travel documents may have separate rules"],
    docs:[["Visa / eVisa / ETA","Check official destination source"],["Return / onward ticket","Destination-specific"],["Proof of funds","Destination-specific"],["Accommodation","Destination-specific"]],
    conditions:[
      "The country is fully supported by the database catalogue and rule engine, but this destination does not yet have a curated all-nationality legal rule module.",
      "The site does not guess visa or passport-validity rules where no verified module is stored."
    ],
    source:{...src,last_verified:src.last_verified||"2026-09-05"}
  };
}

function destinationRule(n,d){
  if(has(systems.schengen.members,d)) return schengenRule(n,d);
  if(d==="GB") return ukRule(n);
  return genericRule(n,d);
}

function ukTransit(n, airside, changeAirport, baggage){
  const u=systems.uk;
  const landside = airside!=="yes" || changeAirport==="yes" || baggage==="yes";
  if(n==="GB" || n==="IE"){
    return {label:"No UK transit visa required for this nationality/status", detail:"Carrier document requirements still apply.", source:u.source_transit};
  }
  if(!landside){
    if(has(u.direct_airside_transit_visa,n)){
      return {
        label:"Direct Airside Transit Visa normally required unless a TWOV exemption applies",
        detail:"Airside transit requires arrival/departure by air, same-airport onward flight on the same day, correct onward documents, and any applicable exemption. Qualifying visas/residence permits can create exemptions.",
        source:u.source_transit
      };
    }
    return {
      label:"No UK airside transit visa normally required on nationality grounds",
      detail:"This assumes the passenger stays airside, does not change airport or pass the border, and has correct onward documents. Check airport availability and carrier handling.",
      source:u.source_transit
    };
  }
  if(has(u.visa_nationals,n)){
    return {
      label:"UK landside transit permission/visa may be required",
      detail:"Visa nationals who pass the UK border normally need the appropriate transit/entry permission unless they satisfy a Transit Without Visa exemption. Qualifying visas/residence permits and itinerary timing can matter.",
      source:u.source_transit
    };
  }
  if(has(u.eta_eligible,n)){
    return {
      label:"UK border crossing: ETA/other entry permission generally required",
      detail:"Because this itinerary is landside, normal UK entry permission rules apply rather than pure airside transit. Existing UK status or another exemption may change this.",
      source:u.source_transit
    };
  }
  return {label:"Check UK landside transit permission",detail:"Passing border control changes this from airside transit to UK entry/landside transit.",source:u.source_transit};
}

function render(n,d){
  const r=destinationRule(n,d);
  let html=`
  <div class="result-hero">
    <div class="route">${flag(n)} ${esc(nameFor(n))} → ${flag(d)} ${esc(nameFor(d))} • AIR TRAVEL</div>
    <h2>Destination entry requirements</h2>
    <span class="status">${esc(r.label)}</span>
  </div>
  <div class="result-grid">
    <div class="result-card">
      <h3>Passport / travel document</h3>
      <div class="kv"><span>Passport mandatory</span><span class="value">${r.passportRequired===false?"No — alternative document may be accepted":"Yes / recognised travel document"}</span></div>
      <div class="kv"><span>Minimum validity</span><span class="value">${esc(r.validity)}</span></div>
      <div class="kv"><span>Stay / permission</span><span class="value">${esc(r.maxStay)}</span></div>
    </div>
    <div class="result-card">
      <h3>Accepted identity / travel documents</h3>
      <ul class="accepted-list">${r.accepted.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    </div>
    <div class="result-card">
      <h3>Other documents</h3>
      ${r.docs.map(([a,b])=>`<div class="doc-row"><span>${esc(a)}</span><span class="badge">${esc(b)}</span></div>`).join("")}
    </div>
    <div class="result-card">
      <h3>Source & verification</h3>
      <p class="source">${esc(r.source.name)}<br>Checked in ruleset: 05 Sep 2026<br><a href="${esc(r.source.url)}" target="_blank" rel="noopener">Open official/source guidance →</a></p>
    </div>
    <div class="result-card" style="grid-column:1/-1">
      <h3>Conditions</h3>
      <ul class="accepted-list">${r.conditions.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    </div>
  </div>`;

  if(transit){
    const tc=$("transitCountry").value;
    if(!tc){
      html+=`<div class="notice">Choose the transit country to calculate the transit leg.</div>`;
    } else if(tc==="GB"){
      const tr=ukTransit(n,$("airside").value,$("airportChange").value,$("baggage").value);
      html+=`<div class="result-card transit-card"><h3>Transit: ${flag(tc)} United Kingdom</h3>
        <div class="kv"><span>Result</span><span class="value">${esc(tr.label)}</span></div>
        <p>${esc(tr.detail)}</p>
        <p class="source"><a href="${esc(tr.source.url)}" target="_blank" rel="noopener">UK carrier transit guidance →</a></p>
      </div>`;
    } else {
      html+=`<div class="result-card transit-card"><h3>Transit: ${flag(tc)} ${esc(nameFor(tc))}</h3>
        <div class="notice">This transit country is in the catalogue, but its airport-specific transit module is not yet curated. Do not infer transit permission from destination-entry rules. Verify airside/landside, baggage and airport-change conditions with the transit authority/airline.</div>
      </div>`;
    }
  }

  html+=`<div class="notice"><strong>Scope:</strong> ordinary passports, visitor/tourist travel and air travel. Rules can change and individual status can override nationality-level rules. Confirm current requirements before travel.</div>`;
  $("results").innerHTML=html;
  $("results").classList.remove("hidden");
  $("results").scrollIntoView({behavior:"smooth",block:"start"});
}

load().catch(err=>{
  console.error(err);
  $("results").innerHTML='<div class="notice">Could not load the database. Use GitHub Pages or a local web server rather than opening index.html directly.</div>';
  $("results").classList.remove("hidden");
});
