let countries=[], systems={}, destinationSources={}, transit=false;
const $=id=>document.getElementById(id);

function esc(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function flag(code){
  if(code==="XK") return "🇽🇰";
  if(!code||code.length!==2) return "";
  return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt()));
}
function nameFor(code){return countries.find(c=>c.code===code)?.name||code}
function has(arr,code){return (arr||[]).includes(code)}

function setupPicker(searchId, hiddenId, menuId){
  const input=$(searchId), hidden=$(hiddenId), menu=$(menuId);
  let active=-1, shown=[];

  function draw(){
    const q=input.value.trim().toLowerCase();
    shown=countries.filter(c=>{
      if(!q) return true;
      return c.name.toLowerCase().includes(q) ||
             c.code.toLowerCase().startsWith(q) ||
             (c.alpha3||"").toLowerCase().startsWith(q);
    }).sort((a,b)=>{
      const aq=a.code.toLowerCase()===q || (a.alpha3||"").toLowerCase()===q;
      const bq=b.code.toLowerCase()===q || (b.alpha3||"").toLowerCase()===q;
      if(aq!==bq) return aq ? -1 : 1;
      const an=a.name.toLowerCase().startsWith(q);
      const bn=b.name.toLowerCase().startsWith(q);
      if(an!==bn) return an ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).slice(0,80);
    active=-1;
    menu.innerHTML=shown.length?shown.map((c,i)=>`
      <button type="button" class="country-option" data-i="${i}">
        <span class="country-option-main"><span>${flag(c.code)}</span><span class="country-option-name">${esc(c.name)}</span></span>
        <span class="country-option-code">${esc(c.code)}</span>
      </button>`).join(""):`<div class="country-empty">No matching country.</div>`;
    menu.classList.remove("hidden");
    menu.querySelectorAll(".country-option").forEach(b=>b.onclick=()=>choose(shown[Number(b.dataset.i)]));
  }
  function choose(c){
    if(!c)return;
    hidden.value=c.code;
    input.value=`${flag(c.code)} ${c.name}`;
    input.classList.add("picker-selected");
    menu.classList.add("hidden");
  }
  input.addEventListener("focus",draw);
  input.addEventListener("input",()=>{hidden.value="";input.classList.remove("picker-selected");draw()});
  input.addEventListener("keydown",e=>{
    const opts=[...menu.querySelectorAll(".country-option")];
    if(e.key==="ArrowDown"){e.preventDefault();active=Math.min(active+1,opts.length-1)}
    else if(e.key==="ArrowUp"){e.preventDefault();active=Math.max(active-1,0)}
    else if(e.key==="Enter"&&active>=0){e.preventDefault();choose(shown[active]);return}
    else if(e.key==="Escape"){menu.classList.add("hidden");return}
    opts.forEach((x,i)=>x.classList.toggle("active",i===active));
    if(opts[active])opts[active].scrollIntoView({block:"nearest"});
  });
  document.addEventListener("click",e=>{if(!e.target.closest(`[data-picker]`))menu.classList.add("hidden")});
}

async function load(){
  [countries,systems,destinationSources]=await Promise.all([
    fetch("data/countries.json").then(r=>r.json()),
    fetch("data/rule-systems.json").then(r=>r.json()),
    fetch("data/destination-sources.json").then(r=>r.json())
  ]);
  setupPicker("nationalitySearch","nationality","nationalityMenu");
  setupPicker("destinationSearch","destination","destinationMenu");
  setupPicker("transitCountrySearch","transitCountry","transitCountryMenu");
}

document.querySelectorAll("[data-transit]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll("[data-transit]").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");transit=btn.dataset.transit==="yes";
  $("transitPanel").classList.toggle("hidden",!transit);
}));

$("checkBtn").addEventListener("click",()=>{
  const n=$("nationality").value,d=$("destination").value;
  if(!n||!d){alert("Type and select both nationality and destination.");return}
  render(n,d);
});

const EU_EEA_CH=new Set(["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","CH"]);
const WESTERN_MAIN=new Set([...EU_EEA_CH,"GB","US","CA","AU","JP","NZ"]);
const COMMON_VISA_FREE_ASIA=new Set([...WESTERN_MAIN,"KR"]);
const US_VWP=new Set(["AD","AU","AT","BE","BN","CL","HR","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IL","IT","JP","LV","LI","LT","LU","MT","MC","NL","NZ","NO","PL","PT","QA","RO","SM","SG","SK","SI","KR","ES","SE","CH","TW","GB"]);
const CA_ETA=new Set(["AD","AU","AT","BE","BG","CL","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IL","IT","JP","KR","LV","LI","LT","LU","MT","MC","NL","NZ","NO","PL","PT","RO","SM","SG","SK","SI","ES","SE","CH","GB"]);
const AU_EVISA=new Set([...EU_EEA_CH,"GB"]);
const AU_ETA=new Set(["US","CA","JP","KR","SG","MY","BN","HK"]);
const SA_EVI=new Set(["AL","AD","AU","AT","AZ","BS","BB","BE","BR","BN","BG","CA","CN","HR","CY","CZ","DK","EE","FI","FR","GE","DE","GR","GD","HU","IS","IE","IT","JP","KZ","KR","KG","LV","LI","LT","LU","MY","MV","MT","MU","MC","ME","NL","NZ","NO","PA","PL","PT","RO","RU","KN","SM","SC","SG","SK","SI","ZA","ES","SE","CH","TJ","TH","TR","UA","GB","US","UZ"]);
const CN_FREE=new Set(["FR","DE","IT","NL","ES","CH","IE","HU","AT","BE","LU","AU","NZ","PL","PT","GR","CY","SI","SK","NO","FI","DK","IS","MC","LI","AD","KR","BG","RO","HR","ME","MK","MT","EE","LV","JP","BR","AR","CL","PE","UY","SA","OM","KW","BH","SE","GB","CA"]);
const SG_VISA=new Set(["AF","DZ","AM","AZ","BD","BY","KP","EG","GE","IN","IR","IQ","JO","KZ","XK","KG","LB","LY","ML","MD","MA","NG","PK","RU","SO","SS","SD","SY","TJ","TN","TM","UA","UZ","YE","CN"]);
const VN_45=new Set(["DE","FR","IT","ES","GB","DK","SE","FI","NO","JP","KR","RU","BY"]);
const KR_FREE=new Set([...WESTERN_MAIN,"SG","MY","BN"]);
const IE_VISA_MAIN=new Set(["IN","CN","PK","BD","NG","RU","ZA","TR","EG","PH","VN","TH","ID"]);
const XK_FREE=new Set([...WESTERN_MAIN,"KR","SG"]);
const TN_FREE=new Set([...WESTERN_MAIN,"KR"]);
const TH_FREE=new Set([...WESTERN_MAIN,"CN","IN","KR","SG"]);

function sourceFor(code,fallbackName,url){
  return destinationSources[code]||{name:fallbackName,url,last_verified:"2026-09-05"};
}
function make(label,status,maxStay,passportRequired,validity,accepted,docs,conditions,source){
  return {label,status,maxStay,passportRequired,validity,accepted,docs,conditions,source};
}

function schengenRule(n,d){
  const s=systems.schengen;
  if(has(s.eu_eea_swiss,n))return make(
    "No visa required — EU/EEA/Swiss free movement","visa_free","Free-movement rules apply.",
    false,s.passport_eu_eea_ch,["Valid passport","Valid national identity card where accepted under free-movement rules"],
    [["Visa","Not required"],["ETA / travel authorisation","No Schengen-wide ETA currently required"]],
    ["Airline boarding-document rules can still require a passport on some routes.","Special travel documents and non-EU family members have separate rules."],s.source);
  const exempt=has(s.visa_exempt,n)||["TW","HK","MO"].includes(n);
  return make(exempt?"Visa-free Schengen short stay":"Schengen visa required",exempt?"visa_free":"visa_required",
    "Up to 90 days in any 180-day period for qualifying short stays.",true,s.passport_non_eu,
    ["Valid recognised passport/travel document"],
    [["Visa",exempt?"Not required for qualifying short stay":"Required before travel"],["Return / onward ticket","May be requested"],["Accommodation","May be requested"],["Proof of funds","May be requested"],["Travel insurance",exempt?"Check destination":"Normally required for visa application"]],
    ["Ordinary passport and short tourism/visitor travel assumed.","Residence permits, long-stay visas and special travel documents can change the result."],s.source);
}
function ukRule(n){
  const u=systems.uk;
  if(n==="GB")return make("No visa or ETA required","visa_free","British citizen/right-of-abode rules apply.",true,"Valid British passport or other accepted evidence of right of abode.",["British passport"],[["Visa","Not required"],["ETA","Not required"]],["Carrier documentation rules still apply."],u.source_entry);
  if(n==="IE")return make("No visa or ETA required — Common Travel Area","visa_free","Common Travel Area rights apply.",false,"Valid identity evidence should be carried; airlines may require a passport.",["Irish passport","Other accepted proof where applicable"],[["Visa","Not required"],["ETA","Not required"]],["Airlines may require a passport even where immigration law allows another identity document."],u.source_entry);
  if(has(u.eta_eligible,n))return make("ETA required before travel","eta","Standard visitor trips are normally up to 6 months.",true,"Use the same valid passport linked to the ETA.",["Ordinary passport linked to ETA"],[["UK ETA","Required unless exempt"],["Visa","Not normally required for ETA-eligible standard visitor"],["Funds / purpose","May be assessed"]],["ETA is permission to travel, not a guarantee of admission.","Existing UK immigration status can remove the ETA requirement."],u.source_entry);
  if(has(u.visa_nationals,n))return make("UK visitor visa required","visa_required","Usually up to 6 months subject to visa granted.",true,"Valid passport or recognised travel document required.",["Valid passport / recognised travel document"],[["Visitor visa","Required before travel"],["Proof of purpose","Assessed"],["Proof of funds","Assessed"]],["Ordinary passport and visitor purpose assumed."],u.source_entry);
  return make("Check UK permission","conditional","Depends on status.",true,"Valid recognised travel document required.",["Recognised travel document"],[["Visa / ETA","Check official UK service"]],["Passport/status-specific rules apply."],u.source_entry);
}
function usaRule(n){
  const s=sourceFor("US","U.S. Department of State / CBP","https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html");
  if(n==="US")return make("U.S. citizen — no visa/ESTA required","visa_free","Citizenship/right of entry rules apply.",true,"Use a valid U.S. passport for international air travel.",["U.S. passport"],[["Visa","Not required"],["ESTA","Not required"]],["U.S. citizens should enter using a U.S. passport."],s);
  if(US_VWP.has(n))return make("Visa Waiver Program — ESTA required","eta","Up to 90 days for qualifying business/tourism/transit.",true,"An e-passport meeting Visa Waiver Program requirements is required.",["Biometric/e-passport"],[["ESTA","Required before boarding"],["Visitor visa","Not required if VWP eligible"],["Return / onward ticket","Required/expected under VWP carrier rules"]],["Prior travel/nationality history can make a traveller ineligible for VWP.","ESTA approval is not a guarantee of admission."],s);
  if(n==="CA")return make("Canadian citizen — visitor visa normally not required","visa_free","Length of admission determined by U.S. border authorities.",true,"Valid Canadian passport required for air travel.",["Canadian passport"],[["ESTA","Not required for Canadian citizens"],["Visitor visa","Normally not required for tourism"]],["Other Canadian travel documents/statuses can have different rules."],s);
  return make("U.S. visitor visa generally required","visa_required","Admission period determined at the border/visa conditions.",true,"Valid passport required; visa validity and passport rules apply.",["Valid passport with appropriate U.S. visa"],[["B1/B2 or applicable visa","Generally required"],["ESTA","Not available unless VWP eligible"]],["Nationality is not mapped to the Visa Waiver Program in this ruleset."],s);
}
function canadaRule(n){
  const s=sourceFor("CA","Government of Canada","https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html");
  if(n==="CA")return make("Canadian citizen — no visa/eTA required","visa_free","Citizenship/right of entry rules apply.",true,"Valid Canadian passport is the normal document for air travel.",["Canadian passport"],[["Visa","Not required"],["eTA","Not required"]],["Dual Canadian citizens generally need a valid Canadian passport to fly to Canada."],s);
  if(n==="US")return make("Visa/eTA not required for U.S. citizen","visa_free","Visitor admission determined at border.",true,"Valid U.S. passport or accepted U.S. travel document.",["U.S. passport"],[["Visa","Not required"],["eTA","Not required"]],["Lawful permanent residents of the U.S. have different documentation rules."],s);
  if(CA_ETA.has(n))return make("eTA required for air travel","eta","Visitor admission commonly up to 6 months, determined at border.",true,"Valid passport used for the eTA application.",["Passport linked to approved eTA"],[["Canada eTA","Required for air travel unless exempt"],["Visitor visa","Not required if eTA eligible"]],["eTA applies to visa-exempt foreign nationals flying to Canada."],s);
  return make("Canadian visitor visa generally required","visa_required","Admission determined at border.",true,"Valid passport and temporary resident visa required unless another exemption applies.",["Valid passport"],[["Temporary Resident Visa","Generally required"]],["Some nationalities may qualify for special eTA pathways based on prior Canadian/U.S. visa history; verify official checker."],s);
}
function australiaRule(n){
  const s=sourceFor("AU","Australian Department of Home Affairs","https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing");
  if(n==="AU")return make("Australian citizen — no visa required","visa_free","Citizenship/right of entry rules apply.",true,"Australian citizens should use a valid Australian passport.",["Australian passport"],[["Visa","Not required"]],["Dual nationals should check Australian passport obligations."],s);
  if(AU_EVISA.has(n))return make("eVisitor visa required before travel","authorization","Typically permits visits of up to 3 months at a time during validity, subject to grant.",true,"Travel on the passport linked to the eVisitor.",["Ordinary passport"],[["eVisitor (subclass 651)","Apply before travel"]],["Visa grant conditions control final permitted stay."],s);
  if(AU_ETA.has(n))return make("ETA required before travel","authorization","Typically permits short visits subject to ETA grant conditions.",true,"Travel on the passport linked to the ETA.",["Ordinary passport"],[["ETA (subclass 601)","Required before travel"]],["ETA eligibility depends on passport nationality."],s);
  return make("Australian visitor visa required","visa_required","Depends on visa grant.",true,"Valid passport required.",["Ordinary passport"],[["Visitor visa / appropriate visa","Required before travel"]],["Use the official visa finder for the exact subclass."],s);
}
function japanRule(n){
  const s=sourceFor("JP","Ministry of Foreign Affairs of Japan","https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html");
  if(n==="JP")return make("Japanese citizen — no visa required","visa_free","Citizenship/right of entry applies.",true,"Valid Japanese passport for international air travel.",["Japanese passport"],[["Visa","Not required"]],[],s);
  if(COMMON_VISA_FREE_ASIA.has(n)&&!["CN","IN"].includes(n))return make("Visa-free short stay","visa_free","Usually 90 days for the main visa-exempt passports; some nationalities differ.",true,"Passport should be valid for the intended stay and accepted by Japanese immigration.",["Ordinary passport"],[["Visa","Not required for qualifying short stay"],["Return/onward arrangements","May be checked"]],["Exact period can vary by nationality."],s);
  return make("Visa required before travel","visa_required","Depends on visa issued.",true,"Valid passport required.",["Ordinary passport"],[["Japanese visa","Required before travel"]],["Electronic visa availability depends on residence/location and nationality."],s);
}
function singaporeRule(n){
  const s=sourceFor("SG","Singapore Immigration & Checkpoints Authority","https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements");
  const visa=SG_VISA.has(n);
  return make(visa?"Singapore entry visa required":"No entry visa required for this passport","visa_"+(visa?"required":"free"),"Visit Pass period is determined at immigration, not by visa validity.",true,"Passport/travel document should generally have at least 6 months' validity at entry.",["Ordinary passport / accepted travel document"],[["Entry visa",visa?"Required before travel":"Not required"],["SG Arrival Card","Required for most foreign visitors; it is not a visa"],["Onward ticket / funds","May be requested"]],["A visa does not guarantee admission.","Length of stay is set by the electronic Visit Pass at the checkpoint."],s);
}
function saudiRule(n){
  const s=sourceFor("SA","Saudi eVisa","https://visa.visitsaudi.com/");
  if(SA_EVI.has(n))return make("Saudi tourist eVisa available","evisa","Tourist eVisa permits visits subject to the issued visa conditions.",true,"Passport must have at least 6 months remaining from the date of entry for eVisa application.",["Ordinary passport from an eligible country"],[["Saudi tourist eVisa","Available online"],["Travel insurance","Typically bundled/required with tourist eVisa process"]],["Passport nationality must be on the eVisa eligible-country list."],s);
  if(n==="IN")return make("Visa required / possible conditional visa-on-arrival pathway","conditional","Depends on visa type/eligibility.",true,"Passport should have at least 6 months validity for Saudi visa processing/entry.",["Ordinary passport"],[["Saudi visa","Required unless traveller qualifies for a specific visa-on-arrival/eVisa exception"]],["Holding and previously using certain valid U.S./UK/Schengen visas or residence status can affect eligibility; verify official portal."],s);
  return make("Saudi visa required unless an exemption applies","visa_required","Depends on visa granted.",true,"Passport validity requirements apply; 6 months is required for tourist eVisa applicants.",["Ordinary passport"],[["Saudi visa","Required before travel unless eligible for another scheme"]],["Check official portal for nationality/status exceptions."],s);
}
function chinaRule(n){
  const s=sourceFor("CN","Chinese Visa Application Service Center / MFA","https://www.visaforchina.cn/");
  if(n==="CN")return make("Chinese citizen — no visa required","visa_free","Citizenship/right of entry applies.",true,"Valid Chinese passport/travel document.",["Chinese passport"],[["Visa","Not required"]],[],s);
  if(CN_FREE.has(n))return make("Visa-free entry under current unilateral policy","visa_free","Up to 30 days for tourism/business/family visit/exchange/transit under the current policy.",true,"Valid ordinary passport required.",["Ordinary passport"],[["Chinese visa","Not required if all visa-free conditions are met"]],["Current unilateral visa-free policy is time-limited; re-check before travel.","Purpose must fall within the permitted visa-free categories."],s);
  return make("Chinese visa generally required","visa_required","Depends on visa granted.",true,"Valid passport required; visa application passport-validity rules apply.",["Ordinary passport"],[["Chinese visa","Generally required before travel"]],["Visa-free transit schemes can create separate exemptions based on route and port; those are itinerary-specific."],s);
}
function thailandRule(n){
  const s=sourceFor("TH","Thai e-Visa / Ministry of Foreign Affairs","https://www.thaievisa.go.th/");
  if(TH_FREE.has(n))return make("Visa-exempt tourism entry","visa_free","Current visa-exemption stay length is subject to Thai immigration policy; verify before departure.",true,"Passport should generally have at least 6 months validity.",["Ordinary passport"],[["Visa","Not required for qualifying visa-exempt stay"],["Onward travel","May be requested"],["Funds","May be requested"]],["Length of visa-exempt stay and extension rules can change."],s);
  return make("Thai visa/eVisa required","visa_required","Depends on visa granted.",true,"Passport generally needs at least 6 months validity.",["Ordinary passport"],[["Thai visa / eVisa","Required unless another exemption applies"]],[],s);
}
function vietnamRule(n){
  const s=sourceFor("VN","Vietnam Immigration Department eVisa","https://evisa.gov.vn/");
  if(VN_45.has(n))return make("Visa-free entry for qualifying short stay","visa_free","Up to 45 days for nationalities covered by Vietnam's unilateral exemption.",true,"Passport should meet Vietnam's entry validity requirements; verify current minimum before travel.",["Ordinary passport"],[["Visa","Not required within exemption period"],["eVisa","Available if staying longer / otherwise eligible"]],["Unilateral exemption periods/policies can change."],s);
  return make("Vietnam eVisa available","evisa","eVisa can be issued for up to 90 days, single or multiple entry, subject to current policy.",true,"Valid passport required; ensure adequate validity beyond the trip.",["Ordinary passport"],[["Vietnam eVisa","Available online for all countries/territories under current policy"]],["Entry must use an eligible eVisa port/checkpoint."],s);
}
function koreaRule(n){
  const s=sourceFor("KR","Korea Visa Portal / K-ETA","https://www.k-eta.go.kr/");
  if(n==="KR")return make("South Korean citizen — no visa required","visa_free","Citizenship/right of entry applies.",true,"Valid Korean passport.",["Korean passport"],[["Visa","Not required"]],[],s);
  if(KR_FREE.has(n))return make("Visa-free short stay; K-ETA rules may apply","conditional","Common visa-waiver stays are generally 90 days for many main passports; nationality-specific periods vary.",true,"Valid passport required.",["Ordinary passport"],[["Visa","Not required for qualifying visa-waiver stay"],["K-ETA","Check current exemption/requirement before travel"]],["K-ETA temporary exemptions and nationality-specific stay periods can change."],s);
  return make("Korean visa generally required","visa_required","Depends on visa issued.",true,"Valid passport required.",["Ordinary passport"],[["Korean visa","Generally required before travel"]],[],s);
}
function irelandRule(n){
  const s=sourceFor("IE","Irish Immigration Service","https://www.irishimmigration.ie/visa-non-visa-required-nationalities/");
  if(EU_EEA_CH.has(n))return make("No Irish visa required — EU/EEA/Swiss traveller","visa_free","Free-movement/Irish rules apply.",false,"Valid passport or national identity card can be accepted for qualifying EU/EEA/Swiss citizens.",["Passport","National identity card where accepted"],[["Visa","Not required"]],["Airlines can have boarding-document requirements."],s);
  if(n==="GB")return make("No Irish visa required — Common Travel Area","visa_free","CTA rights apply.",false,"Passport is not always legally mandatory within CTA, but airlines may require photo ID/passport.",["British passport","Carrier-accepted identity document where applicable"],[["Visa","Not required"]],["Carrier document rules still apply."],s);
  if(["US","CA","AU","JP"].includes(n))return make("No Irish visa required for short visit","visa_free","Visitor permission granted at border; commonly up to 90 days.",true,"Valid passport required.",["Ordinary passport"],[["Visa","Not required"],["Return/onward ticket","May be requested"],["Funds/accommodation","May be requested"]],["Admission length is determined by immigration officer."],s);
  if(IE_VISA_MAIN.has(n))return make("Irish short-stay visa required","visa_required","Short Stay 'C' visa generally covers visits up to 90 days.",true,"Valid passport/travel document required; application validity rules apply.",["Ordinary passport / accepted travel document"],[["Short Stay C visa","Required before travel"],["Purpose/funds/accommodation","Required as part of application"]],["Certain residence cards, Irish residence permits and BIVS circumstances can create exemptions."],s);
  return make("Check Irish visa requirement","conditional","Depends on nationality/travel document.",true,"Valid passport/travel document required.",["Ordinary passport"],[["Irish visa","Use official nationality list"]],["Travel-document holders can have different rules from passport holders."],s);
}
function kosovoRule(n){
  const s=sourceFor("XK","Kosovo Ministry of Foreign Affairs","https://mfa-ks.net/");
  if(XK_FREE.has(n))return make("Visa-free short stay","visa_free","Usually up to 90 days within 180 days for qualifying visa-exempt travellers.",true,"Valid passport/travel document required; keep sufficient validity beyond stay.",["Ordinary passport"],[["Visa","Not required for qualifying short stay"]],["Schengen/US/UK residence or visa status can affect exemptions for otherwise visa-required travellers."],s);
  return make("Kosovo visa required unless an exemption applies","visa_required","Depends on visa/exemption.",true,"Valid passport required.",["Ordinary passport"],[["Kosovo visa","Generally required"]],["Certain valid multi-entry Schengen visas or residence permits can create short-stay exemptions; verify official rule."],s);
}
function tunisiaRule(n){
  const s=sourceFor("TN","Tunisia Ministry of Foreign Affairs / consular guidance","https://www.diplomatie.gov.tn/");
  if(TN_FREE.has(n))return make("Visa-free tourism entry","visa_free","Common short tourism stays are up to 90 days for many visa-exempt passports.",true,"Valid passport required; check exact validity requirement with carrier/consulate.",["Ordinary passport"],[["Visa","Not required for qualifying tourist stay"],["Accommodation/onward arrangements","May be requested"]],["Stay periods can vary by nationality."],s);
  return make("Visa requirement is nationality-specific","conditional","Check consular rule.",true,"Valid passport required.",["Ordinary passport"],[["Tunisian visa","May be required"]],["China/India and other passports can have special tour/group or visa conditions; verify before travel."],s);
}
function southAmericaRule(n,d){
  const src=sourceFor(d,`${nameFor(d)} immigration / foreign ministry`,"https://www.iata.org/en/services/compliance/timatic/");
  const west=WESTERN_MAIN.has(n)||n==="KR";
  if(d==="BR" && ["US","CA","AU"].includes(n))
    return make("Brazil eVisa required","evisa","Visitor stay subject to Brazilian eVisa/immigration rules.",true,"Valid passport required.",["Ordinary passport"],[["Brazil eVisa","Required before travel for this passport group"]],["Rules changed in 2025; verify current eVisa validity and implementation."],src);
  if(west)
    return make("Visa-free short tourist stay","visa_free","Typical permitted stay is destination-specific, commonly 30–90 days.",true,"Valid passport required; exact minimum validity varies by country.",["Ordinary passport"],[["Visa","Generally not required for short tourism"],["Return/onward ticket","May be requested"],["Funds/accommodation","May be requested"]],["Exact permitted stay and passport validity are destination-specific; verify source before travel."],src);
  return make("Visa/authorization requirement is nationality-specific","conditional","Destination-specific.",true,"Valid passport required.",["Ordinary passport"],[["Visa / eVisa","Check destination authority"]],["China and India passport rules vary significantly across South America; verify the specific destination."],src);
}
function genericRule(n,d){
  const s=sourceFor(d,`${nameFor(d)} immigration authority / IATA Timatic`,"https://www.iata.org/en/services/compliance/timatic/");
  return make("Official destination check required","conditional","Not yet curated in this static module.",true,"Exact passport-validity rule must be checked with the official authority.",["Ordinary passport / recognised travel document"],[["Visa / eVisa / ETA","Check official destination source"]],["This destination is in the worldwide catalogue but does not yet have a fully curated static rule module.","The system deliberately does not guess missing immigration rules."],s);
}
function destinationRule(n,d){
  if(has(systems.schengen.members,d))return schengenRule(n,d);
  if(d==="GB")return ukRule(n);
  if(d==="US")return usaRule(n);
  if(d==="CA")return canadaRule(n);
  if(d==="AU")return australiaRule(n);
  if(d==="JP")return japanRule(n);
  if(d==="SG")return singaporeRule(n);
  if(d==="SA")return saudiRule(n);
  if(d==="CN")return chinaRule(n);
  if(d==="TH")return thailandRule(n);
  if(d==="VN")return vietnamRule(n);
  if(d==="KR")return koreaRule(n);
  if(d==="IE")return irelandRule(n);
  if(d==="XK")return kosovoRule(n);
  if(d==="TN")return tunisiaRule(n);
  if(["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"].includes(d))return southAmericaRule(n,d);
  return genericRule(n,d);
}

function ukTransit(n,airside,changeAirport,baggage){
  const u=systems.uk,landside=airside!=="yes"||changeAirport==="yes"||baggage==="yes";
  if(n==="GB"||n==="IE")return {label:"No UK transit visa required",detail:"Carrier document requirements still apply.",source:u.source_transit};
  if(!landside){
    if(has(u.direct_airside_transit_visa,n))return {label:"Direct Airside Transit Visa normally required unless exempt",detail:"Qualifying visas/residence permits and precise onward itinerary can create Transit Without Visa exemptions.",source:u.source_transit};
    return {label:"No UK airside transit visa normally required on nationality grounds",detail:"Assumes same-airport airside connection, no border crossing and correct onward documents.",source:u.source_transit};
  }
  if(has(u.visa_nationals,n))return {label:"Landside transit visa/entry permission may be required",detail:"Visa nationals crossing the UK border need the appropriate permission unless a TWOV exemption applies.",source:u.source_transit};
  if(has(u.eta_eligible,n))return {label:"ETA or other UK entry permission generally required",detail:"Because the itinerary crosses the UK border, normal entry rules apply.",source:u.source_transit};
  return {label:"Check UK landside transit permission",detail:"Crossing immigration changes the journey from pure airside transit to UK entry/landside transit.",source:u.source_transit};
}

function render(n,d){
  const r=destinationRule(n,d);
  let html=`<div class="result-hero"><div class="route">${flag(n)} ${esc(nameFor(n))} → ${flag(d)} ${esc(nameFor(d))} • AIR TRAVEL</div><h2>Destination entry requirements</h2><span class="status">${esc(r.label)}</span></div>
  <div class="result-grid">
    <div class="result-card"><h3>Passport / travel document</h3>
      <div class="kv"><span>Passport mandatory</span><span class="value">${r.passportRequired===false?"No — qualifying alternative ID may be accepted":"Yes / recognised travel document"}</span></div>
      <div class="kv"><span>Minimum validity</span><span class="value">${esc(r.validity)}</span></div>
      <div class="kv"><span>Stay / permission</span><span class="value">${esc(r.maxStay)}</span></div>
    </div>
    <div class="result-card"><h3>Accepted identity / travel documents</h3><ul class="accepted-list">${r.accepted.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="result-card"><h3>Other documents</h3>${r.docs.map(([a,b])=>`<div class="doc-row"><span>${esc(a)}</span><span class="badge">${esc(b)}</span></div>`).join("")}</div>
    <div class="result-card"><h3>Source & verification</h3><p class="source">${esc(r.source.name)}<br>Ruleset date: 05 Sep 2026<br><a href="${esc(r.source.url)}" target="_blank" rel="noopener">Open official/source guidance →</a></p></div>
    <div class="result-card" style="grid-column:1/-1"><h3>Conditions</h3><ul class="accepted-list">${r.conditions.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
  </div>`;
  if(transit){
    const tc=$("transitCountry").value;
    if(!tc)html+=`<div class="notice">Type and select the transit country to calculate the transit leg.</div>`;
    else if(tc==="GB"){
      const tr=ukTransit(n,$("airside").value,$("airportChange").value,$("baggage").value);
      html+=`<div class="result-card transit-card"><h3>Transit: ${flag(tc)} United Kingdom</h3><div class="kv"><span>Result</span><span class="value">${esc(tr.label)}</span></div><p>${esc(tr.detail)}</p><p class="source"><a href="${esc(tr.source.url)}" target="_blank" rel="noopener">Official UK transit guidance →</a></p></div>`;
    }else{
      html+=`<div class="result-card transit-card"><h3>Transit: ${flag(tc)} ${esc(nameFor(tc))}</h3><div class="notice">Airport-specific transit rules for this country are not yet fully curated. Verify airside/landside, baggage collection and airport-change requirements with the official authority or carrier.</div></div>`;
    }
  }
  html+=`<div class="notice"><strong>Scope:</strong> ordinary passports, tourism/visitor travel and air travel. Residence permits, existing visas, special passports, prior travel history and trip purpose can change a result. Confirm current requirements before departure.</div>`;
  $("results").innerHTML=html;$("results").classList.remove("hidden");$("results").scrollIntoView({behavior:"smooth",block:"start"});
}
load().catch(err=>{console.error(err);$("results").innerHTML='<div class="notice">Could not load the database. Use GitHub Pages or a local web server.</div>';$("results").classList.remove("hidden")});
