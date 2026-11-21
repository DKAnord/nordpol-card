/* Nordpol Card – a Christmas dashboard for Home Assistant (countdown, elf cams, nice list, elf of the day, sleigh tracker).
   https://github.com/DKAnord/nordpol-card · MIT License.
   Cam clips stream from CAM_REMOTE_DIR (GitHub Pages) by default. Your own /local/nordpol clips are used with
   cams.prefer_files: true (local first) or cams.remote: false (local only, never contacts github.io). */
(() => {
const VER = "2.5.0";
const REPO_URL = "https://github.com/DKAnord/nordpol-card";
/* === Camera periods (override in card config: periods / file_dir). Each period starts at "from" (local time). === */
const CAM_PERIODS = [
  { name: "morning", from: "05:00" },
  { name: "day",     from: "08:00" },
  { name: "evening", from: "17:00" },
];
const CAM_FILE_DIR = "/local/nordpol";
const CAM_REMOTE_DIR = "https://dkanord.github.io/nordpol-card/media";        // files: cam1_morning.mp4 … cam4_evening.mp4
const CAM_RECHECK_MIN = 10;                    // re-check for new/removed files every 10 min
const FONT_X = `"Mountains of Christmas","Apple Chancery","Brush Script MT","Segoe Script","Snell Roundhand",cursive`;
const BASE_CSS = `
:host{display:block}
ha-card{display:block}
.np{position:relative;overflow:hidden;border-radius:22px;color:#fff8e7;
 background:radial-gradient(120% 90% at 20% 0%,rgba(190,25,45,.55),transparent 60%),
 radial-gradient(120% 90% at 100% 100%,rgba(15,110,60,.55),transparent 60%),
 linear-gradient(160deg,#0d1836 0%,#081026 100%);
 border:1.5px solid rgba(255,214,120,.55);box-shadow:0 0 0 1px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.45),inset 0 0 40px rgba(255,214,120,.08);
 font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif)}
.np:before{content:"";position:absolute;left:0;right:0;top:0;height:7px;
 background:repeating-linear-gradient(135deg,#d6202f 0 14px,#fff 14px 28px);opacity:.9}
.hd{display:flex;align-items:center;gap:10px;padding:18px 18px 6px;font-family:${FONT_X};
 font-size:26px;font-weight:700;color:#ffd878;text-shadow:0 0 12px rgba(255,200,90,.55),0 2px 0 #7a1010;letter-spacing:.5px;user-select:none;-webkit-user-select:none}
.hd small{font-family:system-ui,sans-serif;font-size:12px;color:#cfe8d8;font-weight:500;margin-left:auto;text-shadow:none;letter-spacing:0}
.bd{padding:6px 18px 18px}
.gold{color:#ffd878}.red{color:#ff5a64}.green{color:#7ef0a8}
:focus-visible{outline:2px solid #ffd878;outline-offset:2px}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;
const pad = n => String(n).padStart(2,"0");
/* ===== Sprog / language (config: language: da|en|fr|de|es|sv|nb|nl|fi|pl|it|pt|cs, strings: {...} to override) ===== */
const I18N = {
 da: {
  hero_title:"🎅 Nordpolen", hero_sub:"Julemandens hemmelige kontrolrum", until:"⏳ Juleaften om",
  u_d:"dage", u_h:"timer", u_m:"min", u_s:"sek",
  n_many:"{n} nætter tilbage", n_one:"Kun 1 nat tilbage! 😴", n_zero:"I aften kommer julemanden! 🎅", n_title:"{n} nætter",
  party:"🎉 Glædelig jul! 🎉", party_sub:"Julemanden har været her – kig under træet! 🎁",
  cam_title:"📹 Nordpol-overvågning", cam_live:"● LIVE", cam_tap:"tryk for fuld skærm", cam_lost:"⚠ SIGNAL TABT", cam_restore:"genopretter…",
  cam_lost_label:"CAM 01 – RENSDYRSTALDEN", cam_foot:"🔒 Hemmeligt nisse-kamera · kun for artige børn", cam_close:"tryk for at lukke ✕",
  periods:{morning:"🌅 morgen", day:"☀️ dag", evening:"🌙 aften", morgen:"🌅 morgen", dag:"☀️ dag", aften:"🌙 aften"},
  nice_title:"⭐ Artig-listen", nice_sub:"Julemandens notesbog", parent:"🔓 Forældre-tilstand (lukker selv efter 2 min)",
  why:"Hvad skete der? (fx hjalp med at dække bord)", log_title:"📜 Nisseloggen", no_log:"Ingen notater endnu…", hold:"🔒 hold på overskriften i 1 sek.",
  lv:["Uh-oh… kul i sokken? 🪨","Nisserne holder øje 👀","Næsten artig 🙂","Artig ⭐","SUPER-artig 🌟"],
  reset:"🔄 Nulstil artig-listen", reset_q:"Nulstil artig-listen?", reset_txt:"Alle børn sættes til deres startpoint, og nisseloggen starter forfra.",
  yes_reset:"Ja, nulstil", cancel:"Annullér", new_start:"Ny start – nisserne holder øje! 👀",
  edit:"✏️ Rediger børn", edit_done:"✔ Færdig", e_emoji:"Emoji", e_name:"Navn", e_start:"Start", add:"➕ Tilføj", save:"💾", del:"🗑",
  del_q:"Slet {name}?", del_txt:"{name} fjernes fra artig-listen. Det kan ikke fortrydes.", yes_del:"Ja, slet", new_name:"Nyt barn",
  no_kids:"Ingen børn på listen endnu.", add_kid:"➕ Tilføj barn", loading:"Henter børnene fra julemandens notesbog…",
  load_err:"Kunne ikke hente børnene fra {store}: {err}", no_entity:"findes ikke i Home Assistant", retry:"🔄 Prøv igen",
  stale:"🔄 Ny version af Nordpolen – genindlæser siden…", no_store:"Opret en <b>Local To-do</b>-liste kaldet <code>Nordpol nice list</code>, eller vælg en to-do-liste i kortets visuelle editor.",
  elf_title:"🧝 Dagens nisse", elf_date:"{d}. december", elf_trial:"Prøve-nisse (rigtig nisse fra 1. december)", elf_duty:"vagthavende nisse i dag",
  elf_joke:"Dagens nissevittighed:", elf_tap:"(tryk for svar)", elf_task:"Dagens nisse-opgave:",
  elves:[["Nissen Pip", "Hvad lærer nisser i skolen? Nisse-alfabetet!", "Tegn en julestjerne"],
    ["Nissen Snøvs", "Hvorfor synger rensdyr så rent? De rammer altid den rene tone!", "Hjælp med at dække bord"],
    ["Nissen Klister", "Hvad kalder man en nisse med høretelefoner? Hvad som helst – han kan ikke høre dig!", "Ryd op på dit værelse"],
    ["Nissen Grød", "Hvad spiser snemænd til morgenmad? Snefnug!", "Giv en du holder af et kram"],
    ["Nissen Bjælde", "Hvorfor gik julemanden til lægen? Han havde for meget ho-ho-hosten!", "Lav en julepynt"],
    ["Nissen Kanel", "Hvor bor julemandens kat? I en kat-nisse-hule!", "Sig tak tre gange i dag"],
    ["Nissen Funkel", "Hvad er rødt og hvidt og rødt og hvidt og rødt og hvidt? En julemand, der triller ned ad en bakke!", "Skriv eller tegn et julekort til en du kender"],
    ["Nissen Kardemomme", "Hvor opbevarer snemænd deres penge? I en snebank!", "Hjælp med at bage eller lave mad"],
    ["Nissen Kristtorn", "Hvad sagde det store lys til det lille lys? Jeg går ud i aften!", "Drik et ekstra glas vand som en sund nisse"],
    ["Nissen Glimmer", "Hvorfor bliver snemænd aldrig vrede? De holder hovedet koldt!", "Syng en julesang højt"],
    ["Nissen Kugle", "Hvad kalder man en snemand i juli? En vandpyt!", "Giv nogen en ægte kompliment"],
    ["Nissen Frost", "Hvorfor skulle juletræet til frisøren? Det skulle have en nåle-klipning!", "Kom udenfor og få frisk luft i 15 minutter"],
    ["Nissen Budding", "Hvad er den bedste julegave? En ødelagt tromme – den kan man ikke slå!", "Læs en historie i 10 minutter"],
    ["Nissen Ingefær", "Hvorfor sidder julemanden i skorstenen? Han gider ikke ringe på!", "Red din seng helt selv"],
    ["Nissen Gnist", "Hvad er nissens yndlingsfag i skolen? Nisse-matik!", "Del et stykke legetøj eller slik med nogen"],
    ["Nissen Slikkepind", "Hvorfor har Rudolf rød næse? Fordi han aldrig husker lommetørklædet!", "Fortæl nogen om én ting, du er taknemmelig for"],
    ["Nissen Kakao", "Hvad sagde den ene snemand til den anden? Kan du også lugte gulerødder?", "Stil sko og jakke pænt på plads"],
    ["Nissen Marcipan", "Hvor mange gaver kan julemanden have i en tom sæk? Kun én – så er den ikke tom mere!", "Gør en venlig tjeneste uden at blive bedt om det"],
    ["Nissen Snebold", "Hvorfor var kyllingen med i bandet? Den havde trommestikker!", "Byg noget af klodser, papir eller sne"],
    ["Nissen Peber", "Hvad får man, når man krydser julemanden med en and? En jule-and!", "Ring eller skriv til en bedsteforælder eller ven"],
    ["Nissen Vaffel", "Hvad er nissers yndlingsmusik? Pakke-rap!", "Hjælp med at pakke en gave ind"],
    ["Nissen Ahorn", "Hvorfor var pebernødden ked af det? Den følte sig knust!", "Tegn dit bedste juleminde"],
    ["Nissen Kiks", "Hvorfor gemmer man en mandel i risengrøden? Så der er en mandelgave til den heldige!", "Vælg ét stykke legetøj, du vil give videre"],
    ["Nissen Lakrids", "Hvad står i stuen, er grønt og har masser af kugler? Juletræet!", "Fortæl en vittighed, så nogen kan grine"],
    ["Nissen Istap", "Hvad kalder man en nisse uden hue? En nisse med kold isse!", "Lav 10 hampelmænd som nissernes lærlinge"],
    ["Nissen Karamel", "Hvorfor har nissen sko med bjælder? Så han ikke farer vild i sneen!", "Børst tænder ekstra godt – nisserne kigger med!"],
    ["Nissen Vante", "Hvorfor kan rensdyr ikke lege gemmeleg? Fordi gevirerne altid stikker op!", "Hjælp nogen med at bære noget"],
    ["Nissen Tranebær", "Hvorfor går nissen aldrig sulten i seng? Fordi han altid får risengrød ved skorstenen!", "Sig tak og værsgo hele dagen"],
    ["Nissen Pebermynte", "Hvad er julemandens yndlingskage? Hindbærsnitter – ho-ho-hindbær!", "Hold en time uden skærm"],
    ["Nissen Fudge", "Hvor sover rensdyr? I en rens-dyne!", "Dans til din yndlingssang"]],
  sl_title:"🛷 Kane-tracker", sl_radar:"NORAD-nisse-radar", sl_status:"Status fra værkstedet", sl_demo_mode:"PRØVETUR (simuleret)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Pakker pakket","📜 Ønskesedler læst","🦌 Rensdyr i form","✨ Magisk støv i tanken","🍪 Småkager smagt"],
  sl_after_rows:["🎁 Gaver leveret","😴 Julemanden","🦌 Rensdyr i stalden"],
  sl_after:"🎅 Julemanden er hjemme igen og sover længe. Tak for i år! 💤",
  sl_parked:"🛷 Kanen er parkeret på Nordpolen. Den {date} kan I følge den live her – den regner med at være i {home} ca. kl. {eta}.",
  sl_pre:"🛷 Kanen bliver læsset på Nordpolen… afgang kl. {t}", sl_done:"🏁 Julemanden er landet på Nordpolen igen. Godnat! 💤",
  sl_land:"📍 Julemanden lander i <b>{a}</b>", sl_fly:"✈️ På vej fra <b>{a}</b> til <b>{b}</b>", sl_here:"🎅🏠 Julemanden er i <b>{home}</b> lige nu! Kig ud ad vinduet ✨",
  sl_in_h:"om {h} t {m} min", sl_in_m:"om {m} min!", sl_now:"NU! 👀 Kig ud ad vinduet!", sl_been:"Har været her ✔",
  sl_gifts:"🎁 Gaver leveret: {n} mio.", sl_speed:"⚡ Fart: {s} km/s", sl_rudolf:"🦌 Rudolf: lyser klart", sl_eta:"🏠 ETA {home}",
  sl_hint:"hold på overskriften for prøvetur ✈️", sl_np:"Nordpolen", sl_home:"Hjem",
  sl_news:["Nisserne lakerer de sidste træheste 🐴","Rudolf øver landinger på hustage 🏠","Mor Julemand tester nye pebernødder 🍪",
   "Kanen får nye bjælder monteret 🔔","Nissebanden sorterer ønskesedler 📜","Gavepapir: 4.812 km rullet ud 🎁",
   "Julemanden prøver sin nye røde dragt 🎅","Rensdyrene får ekstra havre 🌾","Nisse-radaren kalibreres 📡","Slæde-GPS opdateres med nye veje 🗺️"],
  tab_sleigh:"Kanen", tab_nice:"Artig", tab_elf:"Nissen", locale:"da-DK"
 },
 sv: {
  hero_title:"🎅 Nordpolen", hero_sub:"Tomtens hemliga kontrollrum", until:"⏳ Julafton om",
  u_d:"dagar", u_h:"timmar", u_m:"min", u_s:"sek",
  n_many:"{n} nätter kvar", n_one:"Bara 1 natt kvar! 😴", n_zero:"I kväll kommer tomten! 🎅", n_title:"{n} nätter",
  party:"🎉 God jul! 🎉", party_sub:"Tomten har varit här – titta under granen! 🎁",
  cam_title:"📹 Nordpolskamerorna", cam_live:"● LIVE", cam_tap:"tryck för helskärm", cam_lost:"⚠ SIGNAL BORTA", cam_restore:"återansluter…",
  cam_lost_label:"CAM 01 – RENSTALLET", cam_foot:"🔒 Hemlig nissekamera · bara för snälla barn", cam_close:"tryck för att stänga ✕",
  periods:{morning:"🌅 morgon", day:"☀️ dag", evening:"🌙 kväll", morgen:"🌅 morgon", dag:"☀️ dag", aften:"🌙 kväll"},
  nice_title:"⭐ Snällistan", nice_sub:"Tomtens anteckningsbok", parent:"🔓 Föräldraläge (stängs efter 2 min)",
  why:"Vad hände? (t.ex. hjälpte till att duka)", log_title:"📜 Nisseloggbok", no_log:"Inga anteckningar än…", hold:"🔒 håll på rubriken i 1 sek.",
  lv:["Oj då… kol i strumpan? 🪨","Nissarna håller koll 👀","Nästan snäll 🙂","Snäll ⭐","SUPERsnäll 🌟"],
  reset:"🔄 Nollställ snällistan", reset_q:"Nollställa snällistan?", reset_txt:"Alla barn får tillbaka sin startpoäng och nisseloggen börjar om.",
  yes_reset:"Ja, nollställ", cancel:"Avbryt", new_start:"Nystart – nissarna håller koll! 👀",
  edit:"✏️ Redigera barn", edit_done:"✔ Klar", e_emoji:"Emoji", e_name:"Namn", e_start:"Startpoäng", add:"➕ Lägg till", save:"💾", del:"🗑",
  del_q:"Ta bort {name}?", del_txt:"{name} tas bort från snällistan. Det går inte att ångra.", yes_del:"Ja, ta bort", new_name:"Nytt barn",
  no_kids:"Inga barn på listan än.", add_kid:"➕ Lägg till barn", loading:"Hämtar barnen från tomtens anteckningsbok…",
  load_err:"Kunde inte hämta barnen från {store}: {err}", no_entity:"finns inte i Home Assistant", retry:"🔄 Försök igen",
  stale:"🔄 Ny version av Nordpolen – laddar om sidan…", no_store:"Skapa en <b>Local To-do</b>-lista med namnet <code>Nordpol nice list</code>, eller välj en att göra-lista i kortets visuella redigerare.",
  elf_title:"🧝 Dagens nisse", elf_date:"{d} december", elf_trial:"Provnisse (den riktiga nissen kommer 1 december)", elf_duty:"dagens jourhavande nisse",
  elf_joke:"Dagens nissevits:", elf_tap:"(tryck för svaret)", elf_task:"Dagens nisseuppdrag:",
  elves:[["Nisse Pip", "Varför sjunger renar så bra? De sjunger alltid rent!", "Rita en julstjärna"],
    ["Nisse Snorre", "Vad kallar man en nisse med hörlurar? Vad du vill – han hör dig ändå inte!", "Hjälp till att duka"],
    ["Nisse Klister", "Vad äter snögubbar till frukost? Snöflingor!", "Städa ditt rum"],
    ["Nisse Gröt", "Varför går nissen aldrig hungrig i säng? Han får alltid tomtegröt på julafton!", "Ge någon du tycker om en kram"],
    ["Nisse Bjällra", "Varför gick tomten till doktorn? Han hade för mycket ho-ho-hosta!", "Pyssla en julprydnad"],
    ["Nisse Kanel", "Vad får man om man korsar tomten med en anka? Kalle Anka på julafton!", "Säg tack tre gånger i dag"],
    ["Nisse Glitter", "Vad är rött och vitt och rött och vitt och rött och vitt? Tomten som rullar nerför en backe!", "Skriv eller rita ett julkort till någon du känner"],
    ["Nisse Kardemumma", "Var förvarar snögubbar sina pengar? På snöbanken!", "Hjälp till att baka eller laga mat"],
    ["Nisse Lussekatt", "Varför fick snögubben skäll? Han var så näsvis!", "Drick ett extra glas vatten som en pigg nisse"],
    ["Nisse Polkagris", "Varför blir snögubbar aldrig arga? De håller huvudet kallt!", "Sjung en julsång högt"],
    ["Nisse Kula", "Vad kallas en snögubbe i juli? En vattenpöl!", "Ge någon en ärlig komplimang"],
    ["Nisse Frost", "Varför gick granen till frisören? Den behövde en barrklippning!", "Gå ut och få frisk luft i 15 minuter"],
    ["Nisse Pepparkaka", "Vilken är den bästa julklappen? En trasig trumma – den går inte att slå!", "Läs en saga i 10 minuter"],
    ["Nisse Ingefära", "Varför åker tomten ner genom skorstenen? Han orkar inte ringa på dörren!", "Bädda din säng helt själv"],
    ["Nisse Gnista", "Vilket är nissens favoritämne i skolan? Nisse-matik!", "Dela en leksak eller lite godis med någon"],
    ["Nisse Klubba", "Varför har Rudolf röd nos? Han glömmer alltid näsduken!", "Berätta för någon om en sak du är tacksam för"],
    ["Nisse Kakao", "Vad sa den ena snögubben till den andra? Känner du också lukten av morötter?", "Ställ undan skor och jacka snyggt"],
    ["Nisse Marsipan", "Hur många paket får plats i en tom säck? Bara ett – sedan är den inte tom längre!", "Gör en snäll tjänst utan att någon ber dig"],
    ["Nisse Snöboll", "Vad säger en snögubbe som är kär? Jag smälter för dig!", "Bygg något av klossar, papper eller snö"],
    ["Nisse Peppar", "Vilken kaka gillar tomten mest? Ho-ho-hallongrottor!", "Ring eller skriv till en mor- eller farförälder eller en kompis"],
    ["Nisse Våffla", "Varför är tomten så bra på trädgårdsarbete? Han älskar att ho-ho-hacka!", "Hjälp till att slå in en julklapp"],
    ["Nisse Saffran", "Varför gick pepparkaksgubben till doktorn? Han kände sig lite smulig!", "Rita ditt bästa julminne"],
    ["Nisse Knäck", "Varför gömmer man en mandel i risgrynsgröten? Så att någon får mandelgåvan!", "Välj en leksak som du vill ge vidare"],
    ["Nisse Lakrits", "Vad står i vardagsrummet, är grönt och har massor av kulor? Julgranen!", "Berätta ett skämt så att någon skrattar"],
    ["Nisse Istapp", "Vad kallas en nisse utan luva? En nisse med kall skalle!", "Gör 10 hampelmän som nisselärlingarna"],
    ["Nisse Kola", "Varför har nissen bjällror på skorna? Så att han inte går vilse i snön!", "Borsta tänderna extra noga – nissarna kollar!"],
    ["Nisse Vante", "Varför kan renar inte leka kurragömma? Hornen sticker alltid upp!", "Hjälp någon att bära något"],
    ["Nisse Lingon", "Varför luktar renar alltid så gott? De är ju rena!", "Säg tack och varsågod hela dagen"],
    ["Nisse Pepparmint", "Varför är tomten så glad hela tiden? Han jobbar bara en dag om året!", "Ha en skärmfri timme"],
    ["Nisse Mandel", "Varför är det så mörkt i december? Solen har också jullov!", "Dansa till din favoritlåt"]],
  sl_title:"🛷 Slädspårare", sl_radar:"Nisseradar", sl_status:"Status från verkstaden", sl_demo_mode:"PROVTUR (simulerad)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Paket inslagna","📜 Önskelistor lästa","🦌 Renarnas form","✨ Magiskt stoft i tanken","🍪 Pepparkakor provsmakade"],
  sl_after_rows:["🎁 Paket levererade","😴 Tomten","🦌 Renar i stallet"],
  sl_after:"🎅 Tomten är hemma igen och sover länge. Tack för i år! 💤",
  sl_parked:"🛷 Släden står parkerad på Nordpolen. Den {date} kan ni följa den live här – den räknar med att vara i {home} runt kl. {eta}.",
  sl_pre:"🛷 Släden lastas på Nordpolen… avgång kl. {t}", sl_done:"🏁 Tomten har landat på Nordpolen igen. God natt! 💤",
  sl_land:"📍 Tomten landar i <b>{a}</b>", sl_fly:"✈️ På väg från <b>{a}</b> till <b>{b}</b>", sl_here:"🎅🏠 Tomten är i <b>{home}</b> just nu! Titta ut genom fönstret ✨",
  sl_in_h:"om {h} h {m} min", sl_in_m:"om {m} min!", sl_now:"NU! 👀 Titta ut genom fönstret!", sl_been:"Har redan varit här ✔",
  sl_gifts:"🎁 Paket levererade: {n} miljoner", sl_speed:"⚡ Fart: {s} km/s", sl_rudolf:"🦌 Rudolf: lyser klart", sl_eta:"🏠 ETA {home}",
  sl_hint:"håll på rubriken för en provtur ✈️", sl_np:"Nordpolen", sl_home:"Hem",
  sl_news:["Nissarna målar de sista dalahästarna 🐴","Rudolf övar landningar på hustak 🏠","Tomtemor provbakar nya pepparkakor 🍪",
   "Släden får nya bjällror monterade 🔔","Nissarna sorterar önskelistor 📜","Presentpapper: 4 812 km utrullat 🎁",
   "Tomten provar sin nya röda dräkt 🎅","Renarna får extra havre 🌾","Nisseradarn kalibreras 📡","Slädens GPS får nya kartor 🗺️"],
  tab_sleigh:"Släden", tab_nice:"Snäll", tab_elf:"Nissen", locale:"sv-SE"
 },
 en: {
  hero_title:"🎅 North Pole", hero_sub:"Santa's secret control room", until:"⏳ Christmas Eve in",
  u_d:"days", u_h:"hours", u_m:"min", u_s:"sec",
  n_many:"{n} nights to go", n_one:"Only 1 night to go! 😴", n_zero:"Santa comes tonight! 🎅", n_title:"{n} nights",
  party:"🎉 Merry Christmas! 🎉", party_sub:"Santa has been here – look under the tree! 🎁",
  cam_title:"📹 North Pole cams", cam_live:"● LIVE", cam_tap:"tap for full screen", cam_lost:"⚠ SIGNAL LOST", cam_restore:"reconnecting…",
  cam_lost_label:"CAM 01 – REINDEER PADDOCK", cam_foot:"🔒 Secret elf cam · nice kids only", cam_close:"tap to close ✕",
  periods:{morning:"🌅 morning", day:"☀️ day", evening:"🌙 evening", morgen:"🌅 morning", dag:"☀️ day", aften:"🌙 evening"},
  nice_title:"⭐ Nice list", nice_sub:"Santa's notebook", parent:"🔓 Parent mode (closes after 2 min)",
  why:"What happened? (e.g. helped set the table)", log_title:"📜 Elf log", no_log:"No notes yet…", hold:"🔒 hold the title for 1 sec.",
  lv:["Uh-oh… coal in the stocking? 🪨","The elves are watching 👀","Almost nice 🙂","Nice ⭐","SUPER nice 🌟"],
  reset:"🔄 Reset nice list", reset_q:"Reset the nice list?", reset_txt:"Every child goes back to their starting score and the elf log starts over.",
  yes_reset:"Yes, reset", cancel:"Cancel", new_start:"Fresh start – the elves are watching! 👀",
  edit:"✏️ Edit children", edit_done:"✔ Done", e_emoji:"Emoji", e_name:"Name", e_start:"Start", add:"➕ Add", save:"💾", del:"🗑",
  del_q:"Delete {name}?", del_txt:"{name} will be removed from the nice list. This cannot be undone.", yes_del:"Yes, delete", new_name:"New child",
  no_kids:"No children on the list yet.", add_kid:"➕ Add child", loading:"Fetching the children from Santa's notebook…",
  load_err:"Could not load the children from {store}: {err}", no_entity:"does not exist in Home Assistant", retry:"🔄 Try again",
  stale:"🔄 New Nordpol version – reloading the page…", no_store:"Create a <b>Local To-do</b> list named <code>Nordpol nice list</code>, or pick a to-do list in the card’s visual editor.",
  elf_title:"🧝 Elf of the day", elf_date:"December {d}", elf_trial:"Trial elf (the real elf arrives December 1st)", elf_duty:"elf on duty today",
  elf_joke:"Elf joke of the day:", elf_tap:"(tap for the answer)", elf_task:"Elf task of the day:",
  elves:[["Elf Pip", "What do elves learn in school? The elf-abet!", "Draw a Christmas star"],
    ["Elf Sniffles", "Why are reindeer so good at singing? They always hit the right deer-tone!", "Help set the table"],
    ["Elf Sticky", "What do snowmen eat for breakfast? Snowflakes!", "Tidy your room"],
    ["Elf Porridge", "What's every elf's favourite music? Wrap music!", "Give someone you love a hug"],
    ["Elf Jingle", "Why did Santa go to the doctor? His ho-ho-hos were hoarse!", "Make a Christmas decoration"],
    ["Elf Cinnamon", "What do you call a cat on the beach at Christmas? Sandy Claws!", "Say thank you three times today"],
    ["Elf Twinkle", "What do you call Santa when he stops moving? Santa Pause!", "Write or draw a Christmas card for someone"],
    ["Elf Nutmeg", "Why did the gingerbread man go to the doctor? He was feeling crumby!", "Help bake or prepare something in the kitchen"],
    ["Elf Holly", "What do you call a snowman in July? A puddle!", "Drink an extra glass of water like a healthy elf"],
    ["Elf Tinsel", "What do reindeer say before they tell a joke? This will sleigh you!", "Sing a Christmas song out loud"],
    ["Elf Bauble", "Why is it so cold at Christmas? Because it's Decembrrr!", "Give someone a genuine compliment"],
    ["Elf Frosty", "How do snowmen travel around? By icicle!", "Go outside for fresh air for 15 minutes"],
    ["Elf Pudding", "Where do snowmen keep their money? In a snow bank!", "Read a story for 10 minutes"],
    ["Elf Ginger", "What do you call a reindeer with no eyes? No-eye-deer!", "Make your bed all by yourself"],
    ["Elf Sparkle", "What's an elf's favourite subject at school? Elf-gebra!", "Share a toy or a treat with someone"],
    ["Elf Candy", "Why did the Christmas tree go to the barber? It needed a trim!", "Tell someone one thing you are grateful for"],
    ["Elf Cocoa", "What's red and white and red and white and red and white? Santa rolling down a hill!", "Put your shoes and jacket away neatly"],
    ["Elf Marzipan", "What did the big candle say to the little candle? I'm going out tonight!", "Do a kind favour without being asked"],
    ["Elf Snowball", "What do you get if you eat Christmas decorations? Tinsel-itis!", "Build something from blocks, paper or snow"],
    ["Elf Pepper", "Why does Santa have three gardens? So he can ho-ho-ho!", "Call or message a grandparent or a friend"],
    ["Elf Waffle", "What's the best Christmas present? A broken drum – you just can't beat it!", "Help wrap a present"],
    ["Elf Maple", "What did one snowman say to the other? Can you smell carrots?", "Draw your favourite Christmas memory"],
    ["Elf Biscuit", "Why was the turkey in the band? Because it had the drumsticks!", "Pick one toy to give to someone else"],
    ["Elf Gumdrop", "What do you get when you cross Santa with a duck? A Christmas quacker!", "Tell someone a joke to make them laugh"],
    ["Elf Icicle", "What did Adam say on the day before Christmas? It's Christmas, Eve!", "Do 10 jumping jacks like the elf trainees"],
    ["Elf Fudge", "Why was Santa's little helper feeling low? He had low elf-esteem!", "Brush your teeth extra well – elves check!"],
    ["Elf Toffee", "What do you call a reindeer wearing earmuffs? Anything you like – he can't hear you!", "Help someone carry something"],
    ["Elf Mittens", "How many presents can Santa fit in an empty sack? Just one – after that it isn't empty!", "Say please and thank you all day"],
    ["Elf Cranberry", "Which of Santa's reindeer has the worst manners? Rude-olph!", "Have a screen-free hour"],
    ["Elf Peppermint", "What do snowmen wear on their heads? Ice caps!", "Dance to your favourite song"]],
  sl_title:"🛷 Sleigh tracker", sl_radar:"Elf radar", sl_status:"Workshop status", sl_demo_mode:"TEST FLIGHT (simulated)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Presents wrapped","📜 Wish lists read","🦌 Reindeer fitness","✨ Magic dust in the tank","🍪 Cookies tasted"],
  sl_after_rows:["🎁 Presents delivered","😴 Santa","🦌 Reindeer in the stable"],
  sl_after:"🎅 Santa is back home sleeping in. Thanks for this year! 💤",
  sl_parked:"🛷 The sleigh is parked at the North Pole. On {date} you can follow it live here – it expects to reach {home} around {eta}.",
  sl_pre:"🛷 The sleigh is being loaded at the North Pole… departure at {t}", sl_done:"🏁 Santa has landed at the North Pole again. Good night! 💤",
  sl_land:"📍 Santa is landing in <b>{a}</b>", sl_fly:"✈️ Flying from <b>{a}</b> to <b>{b}</b>", sl_here:"🎅🏠 Santa is in <b>{home}</b> right now! Look out the window ✨",
  sl_in_h:"in {h} h {m} min", sl_in_m:"in {m} min!", sl_now:"NOW! 👀 Look out the window!", sl_been:"Already been here ✔",
  sl_gifts:"🎁 Presents delivered: {n} million", sl_speed:"⚡ Speed: {s} km/s", sl_rudolf:"🦌 Rudolph: shining bright", sl_eta:"🏠 ETA {home}",
  sl_hint:"hold the title for a test flight ✈️", sl_np:"North Pole", sl_home:"Home",
  sl_news:["The elves are painting the last rocking horses 🐴","Rudolph is practising rooftop landings 🏠","Mrs. Claus is testing new cookies 🍪",
   "New bells are fitted to the sleigh 🔔","The elves are sorting wish lists 📜","Wrapping paper: 4,812 km rolled out 🎁",
   "Santa is trying on his new red suit 🎅","The reindeer get extra oats 🌾","The elf radar is being calibrated 📡","Sleigh GPS is getting new maps 🗺️"],
  tab_sleigh:"Sleigh", tab_nice:"Nice list", tab_elf:"Elf", locale:"en-GB"
 },
 fr: {
  hero_title:"🎅 Pôle Nord", hero_sub:"La salle de contrôle secrète du Père Noël", until:"⏳ Noël dans",
  u_d:"jours", u_h:"heures", u_m:"min", u_s:"sec",
  n_many:"Encore {n} dodos", n_one:"Plus qu’un dodo ! 😴", n_zero:"Le Père Noël passe cette nuit ! 🎅", n_title:"{n} nuits",
  party:"🎉 Joyeux Noël ! 🎉", party_sub:"Le Père Noël est passé – regarde sous le sapin ! 🎁",
  cam_title:"📹 Caméras du Pôle Nord", cam_live:"● EN DIRECT", cam_tap:"toucher pour plein écran", cam_lost:"⚠ SIGNAL PERDU", cam_restore:"reconnexion…",
  cam_lost_label:"CAM 01 – ENCLOS DES RENNES", cam_foot:"🔒 Caméra secrète des lutins · réservé aux enfants sages", cam_close:"toucher pour fermer ✕",
  periods:{morning:"🌅 matin", day:"☀️ journée", evening:"🌙 soir", morgen:"🌅 matin", dag:"☀️ journée", aften:"🌙 soir"},
  nice_title:"⭐ Liste des enfants sages", nice_sub:"Le carnet du Père Noël", parent:"🔓 Mode parents (se ferme après 2 min)",
  why:"Que s’est-il passé ? (ex. a aidé à mettre la table)", log_title:"📜 Journal des lutins", no_log:"Aucune note pour l’instant…", hold:"🔒 maintenir le titre 1 sec.",
  lv:["Oups… du charbon dans la chaussette ? 🪨","Les lutins observent 👀","Presque sage 🙂","Sage ⭐","SUPER sage 🌟"],
  reset:"🔄 Réinitialiser la liste", reset_q:"Réinitialiser la liste des enfants sages ?", reset_txt:"Chaque enfant revient à son score de départ et le journal des lutins repart à zéro.",
  yes_reset:"Oui, réinitialiser", cancel:"Annuler", new_start:"Nouveau départ – les lutins observent ! 👀",
  edit:"✏️ Modifier les enfants", edit_done:"✔ Terminé", e_emoji:"Emoji", e_name:"Prénom", e_start:"Score initial", add:"➕ Ajouter", save:"💾", del:"🗑",
  del_q:"Supprimer {name} ?", del_txt:"{name} sera retiré(e) de la liste des enfants sages. Cette action est irréversible.", yes_del:"Oui, supprimer", new_name:"Nouvel enfant",
  no_kids:"Aucun enfant sur la liste pour l’instant.", add_kid:"➕ Ajouter un enfant", loading:"Lecture du carnet du Père Noël…",
  load_err:"Impossible de charger les enfants depuis {store} : {err}", no_entity:"n’existe pas dans Home Assistant", retry:"🔄 Réessayer",
  stale:"🔄 Nouvelle version de Nordpol – rechargement…", no_store:"Créez une liste <b>Local To-do</b> nommée <code>Nordpol nice list</code>, ou sélectionnez une liste dans l’éditeur visuel de la carte.",
  elf_title:"🧝 Le lutin du jour", elf_date:"{d} décembre", elf_trial:"Lutin d’essai (le vrai lutin arrive le 1er décembre)", elf_duty:"lutin de garde aujourd’hui",
  elf_joke:"La blague du lutin du jour :", elf_tap:"(toucher pour la réponse)", elf_task:"Mission du lutin du jour :",
  elves:[["Lutin Pipou", "Que dit un lutin quand il compte ? Un, deux, trois… lutin !", "Dessine une étoile de Noël"],
    ["Lutin Reniflou", "Pourquoi les rennes chantent-ils si bien ? Parce qu’ils ont toujours le bon bois de voix !", "Aide à mettre la table"],
    ["Lutin Collant", "Comment appelle-t-on un lutin avec un casque audio ? Comme tu veux, il ne t’entend pas !", "Range ta chambre"],
    ["Lutin Bouillie", "Que mangent les bonshommes de neige au petit-déjeuner ? Des flocons !", "Fais un gros câlin à quelqu’un que tu aimes"],
    ["Lutin Clochette", "Pourquoi le Père Noël est-il allé chez le médecin ? Il avait trop de ho-ho-hoquet !", "Fabrique une décoration de Noël"],
    ["Lutin Cannelle", "Comment appelle-t-on un chat sur la plage à Noël ? Le Père Griffes !", "Dis merci trois fois aujourd’hui"],
    ["Lutin Étincelle", "Comment appelle-t-on le Père Noël quand il s’arrête ? Le Père Pause !", "Écris ou dessine une carte de Noël pour quelqu’un"],
    ["Lutin Muscade", "Pourquoi le bonhomme en pain d’épices est-il allé chez le docteur ? Il se sentait tout émietté !", "Aide à préparer ou cuisiner quelque chose"],
    ["Lutin Houx", "Comment appelle-t-on un bonhomme de neige en juillet ? Une flaque d’eau !", "Bois un grand verre d’eau comme un lutin en pleine forme"],
    ["Lutin Guirlande", "Que disent les rennes avant de raconter une blague ? Celle-ci va vous faire traîner de rire !", "Chante une chanson de Noël à voix haute"],
    ["Lutin Boule-de-Neige", "Pourquoi fait-il si froid à Noël ? Parce qu’on est en décem-brrr !", "Fais un vrai compliment à quelqu’un"],
    ["Lutin Givre", "Comment voyagent les bonshommes de neige ? En glaçon-cycle !", "Sors prendre l’air frais pendant 15 minutes"],
    ["Lutin Bûchette", "Quel est le meilleur cadeau de Noël ? Un tambour cassé – impossible de le battre !", "Lis une histoire pendant 10 minutes"],
    ["Lutin Gingembre", "Pourquoi le Père Noël passe-t-il par la cheminée ? Il a la flemme de sonner !", "Fais ton lit tout seul comme un grand"],
    ["Lutin Éclat", "Quelle est la matière préférée des lutins ? La lutin-ématique !", "Partage un jouet ou une friandise avec quelqu’un"],
    ["Lutin Sucre-d’Orge", "Pourquoi le sapin de Noël est-il allé chez le coiffeur ? Il avait besoin d’une petite coupe d’aiguilles !", "Dis à quelqu’un une chose pour laquelle tu es reconnaissant"],
    ["Lutin Cacao", "Qu’est-ce qui est rouge et blanc et rouge et blanc et rouge et blanc ? Le Père Noël qui dévale une colline !", "Range bien tes chaussures et ton manteau"],
    ["Lutin Massepain", "Qu’a dit la grande bougie à la petite bougie ? Ce soir, je m’éteins !", "Rends service à quelqu’un sans qu’on te le demande"],
    ["Lutin Flocon", "Qu’attrape-t-on si l’on mange des décorations de Noël ? Une guirlandite !", "Construis quelque chose avec des blocs, du papier ou de la neige"],
    ["Lutin Pain-d’Épices", "Pourquoi le Père Noël a-t-il trois jardins ? Pour pouvoir faire ho-ho-ho !", "Appelle ou envoie un message à un grand-parent ou à un ami"],
    ["Lutin Gaufre", "Quelle est la musique préférée des lutins ? Le papier-cadeau rap !", "Aide à emballer un cadeau"],
    ["Lutin Érable", "Qu’a dit un bonhomme de neige à l’autre ? Tu sens la carotte toi aussi ?", "Dessine ton plus beau souvenir de Noël"],
    ["Lutin Biscuit", "Pourquoi la dinde jouait-elle dans l’orchestre ? Parce qu’elle avait déjà les baguettes !", "Choisis un jouet à offrir à quelqu’un d’autre"],
    ["Lutin Caramel", "Qu’obtient-on en croisant le Père Noël avec un canard ? Un Père Coin-coin !", "Raconte une blague pour faire rire quelqu’un"],
    ["Lutin Glaçon", "Que faut-il faire quand un lutin éternue ? Lui souhaiter joyeux nez-l !", "Fais 10 sauts en étoile comme les apprentis lutins"],
    ["Lutin Praline", "Pourquoi les lutins ont-ils des clochettes sur leurs chaussures ? Pour ne pas se perdre dans la neige !", "Brosse-toi très bien les dents – les lutins vérifient !"],
    ["Lutin Moufle", "Pourquoi les rennes ne savent-ils pas jouer à cache-cache ? Parce que leurs bois dépassent toujours !", "Aide quelqu’un à porter quelque chose"],
    ["Lutin Canneberge", "Pourquoi un lutin ne va-t-il jamais dormir le ventre vide ? Parce qu’il laisse toujours une part du goûter !", "Dis s’il te plaît et merci toute la journée"],
    ["Lutin Menthe", "Quel est le gâteau préféré du Père Noël ? Le moelleux au ho-ho-chocolat !", "Passe une heure sans écran"],
    ["Lutin Truffe", "Où dorment les bonshommes de neige ? Sur des matelas d’eau !", "Danse sur ta chanson préférée"]],
  sl_title:"🛷 Suivi du traîneau", sl_radar:"Radar des lutins", sl_status:"État de l’atelier", sl_demo_mode:"VOL D’ESSAI (simulé)", sl_live:"EN DIRECT {date}",
  sl_rows:["🎁 Cadeaux emballés","📜 Listes de souhaits lues","🦌 Forme des rennes","✨ Poussière magique dans le réservoir","🍪 Biscuits goûtés"],
  sl_after_rows:["🎁 Cadeaux livrés","😴 Père Noël","🦌 Rennes à l’écurie"],
  sl_after:"🎅 Le Père Noël est rentré et fait la grasse matinée. Merci et à l’année prochaine ! 💤",
  sl_parked:"🛷 Le traîneau est garé au Pôle Nord. Le {date}, suivez-le en direct ici – arrivée prévue à {home} vers {eta}.",
  sl_pre:"🛷 Chargement du traîneau au Pôle Nord… décollage à {t}", sl_done:"🏁 Le Père Noël a atterri au Pôle Nord. Bonne nuit ! 💤",
  sl_land:"📍 Le Père Noël atterrit à <b>{a}</b>", sl_fly:"✈️ En vol de <b>{a}</b> vers <b>{b}</b>", sl_here:"🎅🏠 Le Père Noël est à <b>{home}</b> en ce moment ! Regarde par la fenêtre ✨",
  sl_in_h:"dans {h} h {m} min", sl_in_m:"dans {m} min !", sl_now:"MAINTENANT ! 👀 Regarde par la fenêtre !", sl_been:"Déjà passé par ici ✔",
  sl_gifts:"🎁 Cadeaux livrés : {n} millions", sl_speed:"⚡ Vitesse : {s} km/s", sl_rudolf:"🦌 Rodolphe : nez bien brillant", sl_eta:"🏠 Arrivée {home}",
  sl_hint:"maintenir le titre pour un vol d’essai ✈️", sl_np:"Pôle Nord", sl_home:"Maison",
  sl_news:["Les lutins peignent les derniers chevaux à bascule 🐴","Rodolphe s’entraîne aux atterrissages sur les toits 🏠","Mère Noël teste de nouveaux biscuits 🍪",
   "De nouveaux grelots sont posés sur le traîneau 🔔","Les lutins trient les listes de souhaits 📜","Papier cadeau : 4 812 km déroulés 🎁",
   "Le Père Noël essaie son nouveau costume rouge 🎅","Les rennes ont droit à une ration extra d’avoine 🌾","Le radar des lutins est en cours de calibrage 📡","Le GPS du traîneau met ses cartes à jour 🗺️"],
  tab_sleigh:"Traîneau", tab_nice:"Sages", tab_elf:"Lutin", locale:"fr-FR"
 },
 de: {
  hero_title:"🎅 Nordpol", hero_sub:"Geheimer Kontrollraum des Weihnachtsmanns", until:"⏳ Heiligabend in",
  u_d:"Tage", u_h:"Std", u_m:"Min", u_s:"Sek",
  n_many:"Noch {n} Nächte schlafen", n_one:"Nur noch 1 Nacht schlafen! 😴", n_zero:"Heute Abend kommt der Weihnachtsmann! 🎅", n_title:"{n} Nächte",
  party:"🎉 Frohe Weihnachten! 🎉", party_sub:"Der Weihnachtsmann war da – schau unter den Baum! 🎁",
  cam_title:"📹 Nordpol-Kameras", cam_live:"● LIVE", cam_tap:"tippen für Vollbild", cam_lost:"⚠ KEIN SIGNAL", cam_restore:"verbinde neu…",
  cam_lost_label:"CAM 01 – RENTIERSTALL", cam_foot:"🔒 Geheime Wichtel-Kamera · nur für artige Kinder", cam_close:"zum Schließen tippen ✕",
  periods:{morning:"🌅 Morgen", day:"☀️ Tag", evening:"🌙 Abend", morgen:"🌅 Morgen", dag:"☀️ Tag", aften:"🌙 Abend"},
  nice_title:"⭐ Artig-Liste", nice_sub:"Notizbuch des Weihnachtsmanns", parent:"🔓 Elternmodus (schließt nach 2 Min.)",
  why:"Was ist passiert? (z. B. beim Tischdecken geholfen)", log_title:"📜 Wichtel-Logbuch", no_log:"Noch keine Einträge…", hold:"🔒 Titel 1 Sek. gedrückt halten",
  lv:["Oh-oh… Kohle im Stiefel? 🪨","Die Wichtel schauen zu 👀","Fast artig 🙂","Artig ⭐","SUPER artig 🌟"],
  reset:"🔄 Liste zurücksetzen", reset_q:"Artig-Liste zurücksetzen?", reset_txt:"Alle Kinder werden auf ihren Startwert zurückgesetzt und das Wichtel-Logbuch beginnt von vorn.",
  yes_reset:"Ja, zurücksetzen", cancel:"Abbrechen", new_start:"Neustart – die Wichtel schauen zu! 👀",
  edit:"✏️ Kinder bearbeiten", edit_done:"✔ Fertig", e_emoji:"Emoji", e_name:"Name", e_start:"Start", add:"➕ Hinzufügen", save:"💾", del:"🗑",
  del_q:"{name} löschen?", del_txt:"{name} wird von der Artig-Liste entfernt. Dies kann nicht rückgängig gemacht werden.", yes_del:"Ja, löschen", new_name:"Neues Kind",
  no_kids:"Noch keine Kinder auf der Liste.", add_kid:"➕ Kind hinzufügen", loading:"Lade Kinder aus dem Notizbuch des Weihnachtsmanns…",
  load_err:"Kinder konnten nicht aus {store} geladen werden: {err}", no_entity:"existiert nicht in Home Assistant", retry:"🔄 Erneut versuchen",
  stale:"🔄 Neue Nordpol-Version – Seite wird neu geladen…", no_store:"Erstelle eine <b>Local To-do</b>-Liste namens <code>Nordpol nice list</code> oder wähle eine Liste im visuellen Karten-Editor.",
  elf_title:"🧝 Wichtel des Tages", elf_date:"{d}. Dezember", elf_trial:"Probe-Wichtel (der echte Wichtel kommt am 1. Dezember)", elf_duty:"heute diensthabender Wichtel",
  elf_joke:"Wichtelwitz des Tages:", elf_tap:"(für die Antwort tippen)", elf_task:"Wichtelaufgabe des Tages:",
  elves:[["Wichtel Pieps", "Was sagen Wichtel beim Zählen? Eins, zwei, drei… wichtelig!", "Male einen Weihnachtsstern"],
    ["Wichtel Schnief", "Warum können Rentiere so gut singen? Sie treffen immer den richtigen Geweih-Ton!", "Hilf beim Tischdecken"],
    ["Wichtel Kleber", "Wie nennt man einen Wichtel mit Kopfhörern? Egal – er hört dich sowieso nicht!", "Räum dein Zimmer auf"],
    ["Wichtel Haferbrei", "Was essen Schneemänner zum Frühstück? Schneeflocken!", "Umarme jemanden, den du lieb hast"],
    ["Wichtel Klingel", "Warum ging der Weihnachtsmann zum Arzt? Er hatte zu viel Ho-ho-Husten!", "Bastle eine Weihnachtsdekoration"],
    ["Wichtel Zimt", "Was sagt die Katze in der Weihnachtsnacht? Miau-nacht!", "Sag heute dreimal Danke"],
    ["Wichtel Funkel", "Wie heißt der Weihnachtsmann, wenn er sich nicht bewegt? Der Pause-Mann!", "Schreib oder male eine Weihnachtskarte für jemanden"],
    ["Wichtel Muskat", "Warum ging der Lebkuchenmann zum Arzt? Er fühlte sich ganz zerkrümelt!", "Hilf beim Backen oder Kochen in der Küche"],
    ["Wichtel Stechpalme", "Wie nennt man einen Schneemann im Juli? Eine Pfütze!", "Trink ein extra Glas Wasser wie ein fitter Wichtel"],
    ["Wichtel Lametta", "Was sagen Rentiere vor einem Witz? Der haut dich vom Schlitten!", "Sing laut ein Weihnachtslied"],
    ["Wichtel Kugel", "Warum ist es an Weihnachten so kalt? Weil es Dezem-brrr ist!", "Mach jemandem ein ehrliches Kompliment"],
    ["Wichtel Frost", "Wie reisen Schneemänner durch die Stadt? Mit dem Eiszapfen-Rad!", "Geh 15 Minuten an die frische Luft"],
    ["Wichtel Pudding", "Wo bewahren Schneemänner ihr Geld auf? In einer Schneebank!", "Lies 10 Minuten lang eine Geschichte"],
    ["Wichtel Ingwer", "Warum sitzt der Weihnachtsmann im Schornstein? Weil er keine Lust hat zu klingeln!", "Mach dein Bett ganz alleine"],
    ["Wichtel Glitzer", "Was ist das Lieblingsfach der Wichtel in der Schule? Wichtel-matik!", "Teile ein Spielzeug oder eine Süßigkeit mit jemandem"],
    ["Wichtel Zuckerstange", "Warum ging der Weihnachtsbaum zum Friseur? Er brauchte einen Nadelschnitt!", "Erzähl jemandem eine Sache, für die du dankbar bist"],
    ["Wichtel Kakao", "Was ist rot und weiß und rot und weiß und rot und weiß? Der Weihnachtsmann, der einen Hügel hinunterrollt!", "Stell deine Schuhe und deine Jacke ordentlich weg"],
    ["Wichtel Marzipan", "Was sagte die große Kerze zur kleinen Kerze? Ich gehe heute Abend aus!", "Tu jemandem einen Gefallen, ohne gefragt zu werden"],
    ["Wichtel Schneeball", "Was passiert, wenn man Weihnachtsdeko isst? Man bekommt Lametta-itis!", "Bau etwas aus Bausteinen, Papier oder Schnee"],
    ["Wichtel Pfeffer", "Warum hat der Weihnachtsmann drei Gärten? Damit er ho-ho-hacken kann!", "Ruf Oma, Opa oder einen Freund an oder schreib ihnen"],
    ["Wichtel Waffel", "Was ist das beste Weihnachtsgeschenk? Eine kaputte Trommel – unschlagbar!", "Hilf beim Einpacken eines Geschenks"],
    ["Wichtel Ahorn", "Was sagte ein Schneemann zum anderen? Riechst du auch Möhren?", "Male deine schönste Weihnachtserinnerung"],
    ["Wichtel Keks", "Wo schläft der Weihnachtsmann auf Reisen? In einem Tannen-Bett!", "Wähl ein Spielzeug aus, das du weiterschenken möchtest"],
    ["Wichtel Bonbon", "Was bekommt man, wenn man den Weihnachtsmann mit einer Ente kreuzt? Ein Weihnachts-Quak!", "Erzähl jemandem einen Witz zum Lachen"],
    ["Wichtel Eiszapfen", "Wie nennt man einen Wichtel ohne Mütze? Einen Wichtel mit kaltem Scheitel!", "Mach 10 Hampelmänner wie die Wichtel-Azubis"],
    ["Wichtel Karamell", "Warum tragen Wichtel Schuhe mit Glöckchen? Damit sie sich im Schnee nicht verlaufen!", "Putz dir besonders gründlich die Zähne – die Wichtel schauen zu!"],
    ["Wichtel Fäustling", "Warum können Rentiere schlecht Verstecken spielen? Weil ihre Geweihe immer herausschauen!", "Hilf jemandem beim Tragen"],
    ["Wichtel Preiselbeere", "Warum geht ein Wichtel nie hungrig ins Bett? Weil immer Kekse am Kamin stehen!", "Sag den ganzen Tag freundlich Bitte und Danke"],
    ["Wichtel Pfefferminz", "Was tragen Schneemänner auf dem Kopf? Eiskappen!", "Mach eine Stunde lang bildschirmfreie Zeit"],
    ["Wichtel Nougat", "Wo schlafen Rentiere? Im Rentier-Bett!", "Tanz zu deinem Lieblingslied"]],
  sl_title:"🛷 Schlitten-Tracker", sl_radar:"Wichtel-Radar", sl_status:"Werkstatt-Status", sl_demo_mode:"TESTFLUG (simuliert)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Geschenke verpackt","📜 Wunschzettel gelesen","🦌 Rentier-Fitness","✨ Zauberstaub im Tank","🍪 Plätzchen probiert"],
  sl_after_rows:["🎁 Geschenke verteilt","😴 Weihnachtsmann","🦌 Rentiere im Stall"],
  sl_after:"🎅 Der Weihnachtsmann ist wieder zu Hause und schläft aus. Danke für dieses Jahr! 💤",
  sl_parked:"🛷 Der Schlitten steht am Nordpol bereit. Am {date} könnt ihr ihn hier live verfolgen – geplante Ankunft in {home} gegen {eta} Uhr.",
  sl_pre:"🛷 Der Schlitten wird am Nordpol beladen… Abflug um {t} Uhr", sl_done:"🏁 Der Weihnachtsmann ist wieder am Nordpol gelandet. Gute Nacht! 💤",
  sl_land:"📍 Der Weihnachtsmann landet in <b>{a}</b>", sl_fly:"✈️ Unterwegs von <b>{a}</b> nach <b>{b}</b>", sl_here:"🎅🏠 Der Weihnachtsmann ist gerade in <b>{home}</b>! Schau aus dem Fenster ✨",
  sl_in_h:"in {h} Std. {m} Min.", sl_in_m:"in {m} Min.!", sl_now:"JETZT! 👀 Schau aus dem Fenster!", sl_been:"War schon hier ✔",
  sl_gifts:"🎁 Geschenke verteilt: {n} Mio.", sl_speed:"⚡ Tempo: {s} km/s", sl_rudolf:"🦌 Rudolf: leuchtet hell", sl_eta:"🏠 Ankunft {home}",
  sl_hint:"Titel gedrückt halten für Testflug ✈️", sl_np:"Nordpol", sl_home:"Zuhause",
  sl_news:["Die Wichtel lackieren die letzten Schaukelpferde 🐴","Rudolf übt Landungen auf Hausdächern 🏠","Die Weihnachtsfrau testet neue Plätzchen 🍪",
   "Neue Glöckchen werden am Schlitten montiert 🔔","Die Wichtel sortieren Wunschzettel 📜","Geschenkpapier: 4.812 km ausgerollt 🎁",
   "Der Weihnachtsmann probiert seinen neuen roten Mantel 🎅","Die Rentiere bekommen extra Hafer 🌾","Das Wichtel-Radar wird kalibriert 📡","Das Schlitten-Navi lädt neue Karten 🗺️"],
  tab_sleigh:"Schlitten", tab_nice:"Artig", tab_elf:"Wichtel", locale:"de-DE"
 },
 es: {
  hero_title:"🎅 Polo Norte", hero_sub:"La sala de control secreta de Papá Noel", until:"⏳ Navidad en",
  u_d:"días", u_h:"horas", u_m:"min", u_s:"seg",
  n_many:"Faltan {n} noches", n_one:"¡Solo falta 1 noche! 😴", n_zero:"¡Papá Noel viene esta noche! 🎅", n_title:"{n} noches",
  party:"🎉 ¡Feliz Navidad! 🎉", party_sub:"Papá Noel ya ha pasado – ¡mira debajo del árbol! 🎁",
  cam_title:"📹 Cámaras del Polo Norte", cam_live:"● EN VIVO", cam_tap:"toca para pantalla completa", cam_lost:"⚠ SEÑAL PERDIDA", cam_restore:"reconectando…",
  cam_lost_label:"CAM 01 – ESTABLO DE RENOS", cam_foot:"🔒 Cámara secreta de los elfos · solo para niños buenos", cam_close:"toca para cerrar ✕",
  periods:{morning:"🌅 mañana", day:"☀️ día", evening:"🌙 noche", morgen:"🌅 mañana", dag:"☀️ día", aften:"🌙 noche"},
  nice_title:"⭐ Lista de niños buenos", nice_sub:"El cuaderno de Papá Noel", parent:"🔓 Modo padres (se cierra en 2 min)",
  why:"¿Qué pasó? (p. ej. ayudó a poner la mesa)", log_title:"📜 Diario de los elfos", no_log:"Aún no hay notas…", hold:"🔒 mantén pulsado el título 1 seg.",
  lv:["Uy… ¿carbón en el calcetín? 🪨","Los elfos están mirando 👀","Casi bueno 🙂","Bueno ⭐","¡SÚPER bueno! 🌟"],
  reset:"🔄 Reiniciar lista", reset_q:"¿Reiniciar la lista de niños buenos?", reset_txt:"Todos los niños volverán a su puntuación inicial y el diario de los elfos empezará de cero.",
  yes_reset:"Sí, reiniciar", cancel:"Cancelar", new_start:"¡Nuevo comienzo – los elfos están mirando! 👀",
  edit:"✏️ Editar niños", edit_done:"✔ Listo", e_emoji:"Emoji", e_name:"Nombre", e_start:"Inicio", add:"➕ Añadir", save:"💾", del:"🗑",
  del_q:"¿Eliminar a {name}?", del_txt:"Se eliminará a {name} de la lista. Esta acción no se puede deshacer.", yes_del:"Sí, eliminar", new_name:"Nuevo niño",
  no_kids:"Aún no hay niños en la lista.", add_kid:"➕ Añadir niño", loading:"Cargando los niños del cuaderno de Papá Noel…",
  load_err:"No se pudieron cargar los niños desde {store}: {err}", no_entity:"no existe en Home Assistant", retry:"🔄 Reintentar",
  stale:"🔄 Nueva versión de Nordpol – recargando…", no_store:"Crea una lista <b>Local To-do</b> llamada <code>Nordpol nice list</code> o elige una lista en el editor visual de la tarjeta.",
  elf_title:"🧝 El elfo del día", elf_date:"{d} de diciembre", elf_trial:"Elfo de prueba (el elfo real llega el 1 de diciembre)", elf_duty:"elfo de guardia hoy",
  elf_joke:"El chiste del elfo del día:", elf_tap:"(toca para ver la respuesta)", elf_task:"Misión del elfo del día:",
  elves:[["Elfo Pipo", "¿Qué dice un elfo cuando cuenta? ¡Uno, dos, tres… elfo!", "Dibuja una estrella de Navidad"],
    ["Elfo Moquitos", "¿Por qué cantan tan bien los renos? ¡Porque siempre afinan con sus cuernos!", "Ayuda a poner la mesa"],
    ["Elfo Pegote", "¿Cómo llamas a un elfo con auriculares? Como quieras, ¡no te puede oír!", "Ordena tu habitación"],
    ["Elfo Gachas", "¿Qué desayunan los muñecos de nieve? ¡Copos de nieve!", "Dale un abrazo fuerte a alguien que quieras"],
    ["Elfo Cascabel", "¿Por qué fue Papá Noel al médico? ¡Porque tenía demasiada tos de jo-jo-jo!", "Haz un adorno de Navidad"],
    ["Elfo Canela", "¿Cómo se llama un gato en la playa por Navidad? ¡Santa Garras!", "Da las gracias tres veces hoy"],
    ["Elfo Destello", "¿Cómo se llama Papá Noel cuando se detiene? ¡Santa Pausa!", "Escribe o dibuja una tarjeta de Navidad para alguien"],
    ["Elfo Nuez-Moscada", "¿Por qué fue el muñeco de jengibre al médico? ¡Porque se sentía hecho migas!", "Ayuda a cocinar o preparar algo rico"],
    ["Elfo Acebo", "¿Cómo se llama un muñeco de nieve en julio? ¡Un charco!", "Bebe un vaso extra de agua como un elfo sano"],
    ["Elfo Espumillón", "¿Qué dicen los renos antes de contar un chiste? ¡Este os va a tirar del trineo!", "Canta un villancico bien alto"],
    ["Elfo Bolita", "¿Por qué hace tanto frío en Navidad? ¡Porque es diciem-brrr!", "Hazle un cumplido sincero a alguien"],
    ["Elfo Escarcha", "¿Cómo viajan los muñecos de nieve? ¡En bici-hielo!", "Sal a tomar aire fresco durante 15 minutos"],
    ["Elfo Turrón", "¿Dónde guardan su dinero los muñecos de nieve? ¡En un banco de nieve!", "Lee un cuento durante 10 minutos"],
    ["Elfo Jengibre", "¿Por qué baja Papá Noel por la chimenea? ¡Porque le da pereza llamar al timbre!", "Haz tu cama tú solo"],
    ["Elfo Chispa", "¿Cuál es la asignatura favorita de los elfos? ¡Elfo-máticas!", "Comparte un juguete o un dulce con alguien"],
    ["Elfo Caramelo", "¿Por qué fue el árbol de Navidad a la peluquería? ¡Necesitaba un corte de puntas!", "Cuéntale a alguien una cosa por la que das gracias"],
    ["Elfo Cacao", "¿Qué es rojo y blanco y rojo y blanco y rojo y blanco? ¡Papá Noel rodando cuesta abajo!", "Guarda bien tus zapatos y tu abrigo"],
    ["Elfo Mazapán", "¿Qué le dijo la vela grande a la vela pequeña? ¡Esta noche salgo!", "Haz un favor amable sin que te lo pidan"],
    ["Elfo Copito", "¿Cuál es el animal más navideño? ¡El reno-ceronte!", "Construye algo con bloques, papel o nieve"],
    ["Elfo Pimienta", "¿Por qué tiene Papá Noel tres jardines? ¡Para poder decir jo-jo-jo!", "Llama o escribe a un abuelo o a un amigo"],
    ["Elfo Gofre", "¿Cuál es el mejor regalo de Navidad? Un tambor roto: ¡no hay quien lo toque!", "Ayuda a envolver un regalo"],
    ["Elfo Arce", "¿Qué le dijo un muñeco de nieve al otro? ¿Tú también hueles a zanahoria?", "Dibuja tu mejor recuerdo de Navidad"],
    ["Elfo Galleta", "¿Dónde duerme Papá Noel cuando viaja? ¡En una cama de pinos!", "Elige un juguete para regalar a otro niño"],
    ["Elfo Gominola", "¿Qué sale si cruzas a Papá Noel con un pato? ¡Un Papá Cuac-el!", "Cuenta un chiste para hacer reír a alguien"],
    ["Elfo Carámbano", "¿Qué hace un elfo cuando estornuda? ¡A-chús-vidad!", "Haz 10 saltos de tijera como los aprendices de elfo"],
    ["Elfo Dulce", "¿Por qué llevan cascabeles los zapatos de los elfos? ¡Para no perderse en la nieve!", "Cepíllate muy bien los dientes: ¡los elfos miran!"],
    ["Elfo Manopla", "¿Por qué no saben jugar al escondite los renos? ¡Porque siempre se les ven los cuernos!", "Ayuda a alguien a llevar algo"],
    ["Elfo Arándano", "¿Por qué nunca se acuesta con hambre un elfo? ¡Porque siempre dejan galletas junto a la chimenea!", "Di por favor y gracias todo el día"],
    ["Elfo Menta", "¿Qué llevan los muñecos de nieve en la cabeza? ¡Gorros de hielo!", "Pasa una hora sin pantallas"],
    ["Elfo Polvorón", "¿Cuál es la música favorita de los elfos? ¡El papel de regalo rap!", "Baila tu canción favorita"]],
  sl_title:"🛷 Rastreador del trineo", sl_radar:"Radar de los elfos", sl_status:"Estado del taller", sl_demo_mode:"VUELO DE PRUEBA (simulado)", sl_live:"EN VIVO {date}",
  sl_rows:["🎁 Regalos envueltos","📜 Cartas leídas","🦌 Forma de los renos","✨ Polvo mágico en el tanque","🍪 Galletas probadas"],
  sl_after_rows:["🎁 Regalos entregados","😴 Papá Noel","🦌 Renos en el establo"],
  sl_after:"🎅 Papá Noel ya está en casa durmiendo hasta tarde. ¡Gracias y hasta el año que viene! 💤",
  sl_parked:"🛷 El trineo está aparcado en el Polo Norte. El {date} podrás seguirlo en vivo aquí – llegada prevista a {home} hacia las {eta}.",
  sl_pre:"🛷 Cargando el trineo en el Polo Norte… salida a las {t}", sl_done:"🏁 Papá Noel ha aterrizado de nuevo en el Polo Norte. ¡Buenas noches! 💤",
  sl_land:"📍 Papá Noel está aterrizando en <b>{a}</b>", sl_fly:"✈️ Volando de <b>{a}</b> a <b>{b}</b>", sl_here:"🎅🏠 ¡Papá Noel está en <b>{home}</b> ahora mismo! Mira por la ventana ✨",
  sl_in_h:"en {h} h {m} min", sl_in_m:"¡en {m} min!", sl_now:"¡AHORA! 👀 ¡Mira por la ventana!", sl_been:"Ya pasó por aquí ✔",
  sl_gifts:"🎁 Regalos entregados: {n} millones", sl_speed:"⚡ Velocidad: {s} km/s", sl_rudolf:"🦌 Rodolfo: nariz brillante", sl_eta:"🏠 Llegada {home}",
  sl_hint:"mantén pulsado el título para un vuelo de prueba ✈️", sl_np:"Polo Norte", sl_home:"Casa",
  sl_news:["Los elfos están pintando los últimos caballitos de madera 🐴","Rodolfo practica aterrizajes en los tejados 🏠","Mamá Noel prueba nuevas galletas 🍪",
   "Colocan cascabeles nuevos en el trineo 🔔","Los elfos ordenan las cartas de deseos 📜","Papel de regalo: 4.812 km desenrollados 🎁",
   "Papá Noel se prueba su traje rojo nuevo 🎅","Los renos reciben avena extra 🌾","Calibrando el radar de los elfos 📡","El GPS del trineo descarga nuevos mapas 🗺️"],
  tab_sleigh:"Trineo", tab_nice:"Lista", tab_elf:"Elfo", locale:"es-ES"
 },
 nb: {
  hero_title:"🎅 Nordpolen", hero_sub:"Julenissens hemmelige kontrollrom", until:"⏳ Julaften om",
  u_d:"dager", u_h:"timer", u_m:"min", u_s:"sek",
  n_many:"{n} netter igjen", n_one:"Bare 1 natt igjen! 😴", n_zero:"I kveld kommer julenissen! 🎅", n_title:"{n} netter",
  party:"🎉 God jul! 🎉", party_sub:"Julenissen har vært her – se under treet! 🎁",
  cam_title:"📹 Nordpol-kameraene", cam_live:"● LIVE", cam_tap:"trykk for fullskjerm", cam_lost:"⚠ SIGNAL MISTET", cam_restore:"kobler til på nytt…",
  cam_lost_label:"CAM 01 – JULENISSENS KONTOR", cam_foot:"🔒 Hemmelig nissekamera · bare for snille barn", cam_close:"trykk for å lukke ✕",
  periods:{morning:"🌅 morgen",day:"☀️ dag",evening:"🌙 kveld",morgen:"🌅 morgen",dag:"☀️ dag",aften:"🌙 kveld"},
  nice_title:"⭐ Snillelisten", nice_sub:"Julenissens notatbok", parent:"🔓 Foreldremodus (lukkes etter 2 min)",
  why:"Hva skjedde? (f.eks. hjalp til med å dekke bordet)", log_title:"📜 Nisselogg", no_log:"Ingen notater ennå…", hold:"🔒 hold inne tittelen i 1 sek.",
  lv:["Uh-oh… kull i strømpen? 🪨","Nissene holder øye 👀","Nesten snill 🙂","Snill ⭐","SUPER-snill 🌟"],
  reset:"🔄 Nullstill snillelisten", reset_q:"Nullstille snillelisten?",
  reset_txt:"Hvert barn settes tilbake til startpoengsummen, og nisselogen starter på nytt.",
  yes_reset:"Ja, nullstill", cancel:"Avbryt", new_start:"Ny start – nissene holder øye! 👀",
  edit:"✏️ Rediger barn", edit_done:"✔ Ferdig", e_emoji:"Emoji", e_name:"Navn", e_start:"Start", add:"➕ Legg til", save:"💾", del:"🗑",
  del_q:"Slette {name}?", del_txt:"{name} fjernes fra snillelisten. Dette kan ikke angres.", yes_del:"Ja, slett", new_name:"Nytt barn",
  no_kids:"Ingen barn på listen ennå.", add_kid:"➕ Legg til barn", loading:"Henter barna fra julenissens notatbok…",
  load_err:"Kunne ikke laste barna fra {store}: {err}",
  no_entity:"finnes ikke i Home Assistant", retry:"🔄 Prøv igjen",
  stale:"🔄 Ny Nordpol-versjon – laster siden på nytt…",
  no_store:"Opprett en <b>Local To-do</b>-liste med navnet <code>Nordpol nice list</code>, eller velg en gjøremålsliste i kortets visuelle editor.",
  elf_title:"🧝 Dagens nisse", elf_date:"{d}. desember",
  elf_trial:"Prøvenisse (den ekte nissen kommer 1. desember)",
  elf_duty:"nisse på vakt i dag", elf_joke:"Dagens nissevits:", elf_tap:"(trykk for svaret)", elf_task:"Dagens nisseoppdrag:",
  elves:[["Nisse Pip","Hva lærer nissene på skolen? Nissealfabetet – det begynner med ho-ho-ho!","Tegn en julestjerne"],["Nisse Snøfnugg","Hvorfor synger reinen så fint? De treffer alltid den rette rein-tonen!","Hjelp til med å dekke bordet"],["Nisse Klister","Hva spiser snømenn til frokost? Iskrem – den holder seg kald!","Rydd rommet ditt"],["Nisse Grøt","Hva er nissens favorittmusikk? Pakke-rap!","Gi noen du er glad i en klem"],["Nisse Bjelle","Hvorfor gikk julenissen til legen? Han hadde ho-ho-hoste!","Lag en julepynt"],["Nisse Kanel","Hvorfor liker katten julen så godt? Fordi det er esker overalt!","Si takk tre ganger i dag"],["Nisse Gnist","Hva kaller du julenissen når han står stille? En nissepause!","Skriv eller tegn et julekort til noen"],["Nisse Muskat","Hvorfor gikk pepperkakemannen til legen? Han følte seg smuldrete!","Hjelp til å bake pepperkaker"],["Nisse Kristtorn","Hva kaller du en snømann i juli? En vannpøl!","Drikk et ekstra glass vann som en sunn nisse"],["Nisse Glitter","Hva sier reinen før de forteller en vits? Hold deg fast i sleden – nå blir det løyer!","Syng en julesang høyt"],["Nisse Kule","Hvorfor er det så kaldt til jul? Fordi det er desem-brrr!","Gi noen et ekte kompliment"],["Nisse Frost","Hvordan reiser snømenn rundt? Med is-sykkel!","Gå ut i frisk luft i 15 minutter"],["Nisse Pudding","Hvor oppbevarer snømenn pengene sine? I en snøbank!","Les en historie i 10 minutter"],["Nisse Ingefær","Hva kaller du en rein uten øyne? Ingen anelse!","Redd sengen din helt selv"],["Nisse Glimmer","Hva er nissens favorittfag? Nisse-matikk!","Del en leke eller noe godt med noen"],["Nisse Sukkertøy","Hvorfor gikk juletreet til frisøren? Det trengte en klipp!","Fortell noen én ting du er takknemlig for"],["Nisse Kakao","Hva er rødt og hvitt og rødt og hvitt og rødt og hvitt? Julenissen som ruller ned en bakke!","Sett sko og jakke pent på plass"],["Nisse Marsipan","Hva sa det store lyset til det lille lyset? Jeg går ut i kveld!","Gjør en vennlig tjeneste uten å bli spurt"],["Nisse Snøball","Hva får du hvis du spiser julepynt? Glitteritt!","Bygg noe av klosser, papir eller snø"],["Nisse Pepper","Hvorfor rører julenissen risengrøten selv? Fordi han alltid gjemmer mandelen!","Ring eller send en melding til en besteforelder eller en venn"],["Nisse Vaffel","Hva er den beste julegaven? En ødelagt tromme – den kan du bare ikke slå!","Hjelp til med å pakke inn en gave"],["Nisse Lønn","Hva sa den ene snømannen til den andre? Kjenner du lukten av gulrøtter?","Tegn det fineste juleminnet ditt"],["Nisse Kjeks","Hvorfor danset pepperkakemannen på kjøkkenet? Han hadde endelig fått beina å stå på!","Velg en leke du kan gi til noen andre"],["Nisse Seigmann","Hva får du hvis du krysser julenissen med en and? En julekvakker!","Fortell noen en vits så de ler"],["Nisse Istapp","Hvorfor smiler den som finner mandelen i grøten? Fordi mandelgaven venter!","Sett ut en skål risengrøt til nissen"],["Nisse Karamell","Hvorfor var nissehjelperen litt lei seg? Han hadde dårlig nisseselvfølelse!","Puss tennene ekstra godt – nissene sjekker!"],["Nisse Vott","Hva kaller du en rein med øreklokker? Hva du vil – han hører deg ikke!","Hjelp noen med å bære noe"],["Nisse Tyttebær","Hvor mange gaver får plass i julenissens tomme sekk? Bare én – etter det er den ikke tom!","Si vær så snill og takk hele dagen"],["Nisse Peppermynte","Hvilken av reinen har dårligst manerer? Rå-dolf!","Ha en skjermfri time"],["Nisse Mandel","Hva har snømenn på hodet? Iskalotter!","Dans til favorittsangen din"]],
  sl_title:"🛷 Sledesporing", sl_radar:"Nisseradar", sl_status:"Verkstedstatus", sl_demo_mode:"PRØVEFLUKT (simulert)", sl_live:"DIREKTE {date}",
  sl_rows:["🎁 Gaver pakket inn","📜 Ønskelister lest","🦌 Reinform","✨ Magisk støv på tanken","🍪 Pepperkaker smakt"],
  sl_after_rows:["🎁 Gaver levert","😴 Julenissen","🦌 Reinen i stallen"],
  sl_after:"🎅 Julenissen sover lenge hjemme igjen. Takk for i år! 💤",
  sl_parked:"🛷 Sleden står parkert på Nordpolen. Den {date} kan du følge den live her – den skal nå {home} rundt {eta}.",
  sl_pre:"🛷 Sleden lastes på Nordpolen… avgang kl. {t}", sl_done:"🏁 Julenissen har landet på Nordpolen igjen. God natt! 💤",
  sl_land:"📍 Julenissen lander i <b>{a}</b>", sl_fly:"✈️ Flyr fra <b>{a}</b> til <b>{b}</b>", sl_here:"🎅🏠 Julenissen er i <b>{home}</b> akkurat nå! Se ut av vinduet ✨",
  sl_in_h:"om {h} t {m} min", sl_in_m:"om {m} min!", sl_now:"NÅ! 👀 Se ut av vinduet!", sl_been:"Har allerede vært her ✔",
  sl_gifts:"🎁 Gaver levert: {n} millioner", sl_speed:"⚡ Fart: {s} km/s", sl_rudolf:"🦌 Rudolf: lyser sterkt", sl_eta:"🏠 Ankomst {home}",
  sl_hint:"hold inne tittelen for en prøveflukt ✈️", sl_np:"Nordpolen", sl_home:"Hjem",
  sl_news:["Nissene lakker de siste gyngehestene 🐴","Rudolf øver på taklandinger 🏠","Mor Julenisse tester nye pepperkaker 🍪","Fjøsnissen får en skål risengrøt – mandelen er gjemt 🍚","Nissene sorterer ønskelister 📜","Gavepapir: 4 812 km rullet ut 🎁","Julenissen prøver den nye røde drakten 🎅","Reinen får ekstra havre 🌾","Noen øver på å gå julebukk med sang og masker 🐐","Slede-GPS-en får nye kart 🗺️"],
  tab_sleigh:"Slede", tab_nice:"Snill", tab_elf:"Nissen", locale:"nb-NO"
 },
 nl: {
  hero_title:"🎅 Noordpool", hero_sub:"De geheime controlekamer van de Kerstman", until:"⏳ Kerstmis over",
  u_d:"dagen", u_h:"uur", u_m:"min", u_s:"sec",
  n_many:"nog {n} nachten", n_one:"Nog maar 1 nacht! 😴", n_zero:"De Kerstman komt vannacht! 🎅", n_title:"{n} nachten",
  party:"🎉 Vrolijk kerstfeest! 🎉", party_sub:"De Kerstman is geweest – kijk onder de boom! 🎁",
  cam_title:"📹 Noordpoolcamera's", cam_live:"● LIVE", cam_tap:"tik voor volledig scherm", cam_lost:"⚠ SIGNAAL VERLOREN", cam_restore:"opnieuw verbinden…",
  cam_lost_label:"CAM 01 – KANTOOR VAN DE KERSTMAN", cam_foot:"🔒 Geheime elfcamera · alleen voor lieve kinderen", cam_close:"tik om te sluiten ✕",
  periods:{morning:"🌅 ochtend",day:"☀️ dag",evening:"🌙 avond",morgen:"🌅 ochtend",dag:"☀️ dag",aften:"🌙 avond"},
  nice_title:"⭐ Lieve lijst", nice_sub:"Het notitieboek van de Kerstman", parent:"🔓 Oudermodus (sluit na 2 min)",
  why:"Wat gebeurde er? (bijv. hielp de tafel te dekken)", log_title:"📜 Elfenlogboek", no_log:"Nog geen aantekeningen…", hold:"🔒 houd de titel 1 sec. ingedrukt.",
  lv:["Uh-oh… kool in de sok? 🪨","De elfen kijken mee 👀","Bijna lief 🙂","Lief ⭐","SUPER lief 🌟"],
  reset:"🔄 Lieve lijst resetten", reset_q:"De lieve lijst resetten?",
  reset_txt:"Elk kind gaat terug naar de startscore en het elfenlogboek begint opnieuw.",
  yes_reset:"Ja, resetten", cancel:"Annuleren", new_start:"Nieuwe start – de elfen kijken mee! 👀",
  edit:"✏️ Kinderen bewerken", edit_done:"✔ Klaar", e_emoji:"Emoji", e_name:"Naam", e_start:"Start", add:"➕ Toevoegen", save:"💾", del:"🗑",
  del_q:"{name} verwijderen?", del_txt:"{name} wordt van de lieve lijst gehaald. Dit kan niet ongedaan worden gemaakt.", yes_del:"Ja, verwijderen", new_name:"Nieuw kind",
  no_kids:"Nog geen kinderen op de lijst.", add_kid:"➕ Kind toevoegen", loading:"Kinderen ophalen uit het notitieboek van de Kerstman…",
  load_err:"Kon de kinderen niet laden van {store}: {err}",
  no_entity:"bestaat niet in Home Assistant", retry:"🔄 Opnieuw proberen",
  stale:"🔄 Nieuwe Nordpol-versie – pagina wordt herladen…",
  no_store:"Maak een <b>Local To-do</b>-lijst met de naam <code>Nordpol nice list</code>, of kies een takenlijst in de visuele editor van de kaart.",
  elf_title:"🧝 Elf van de dag", elf_date:"{d} december",
  elf_trial:"Proefelf (de echte elf komt op 1 december)",
  elf_duty:"elf van dienst vandaag", elf_joke:"Elfgrap van de dag:", elf_tap:"(tik voor het antwoord)", elf_task:"Elfopdracht van de dag:",
  elves:[["Elf Pip","Wat leren elfen op school? Het elfabet!","Teken een kerstster"],["Elf Sneeuwvlok","Waarom zingen rendieren zo goed? Ze raken altijd de juiste beltoon!","Help de tafel te dekken"],["Elf Klever","Wat eten sneeuwpoppen bij het ontbijt? Sneeuwvlokken!","Ruim je kamer op"],["Elf Pap","Wat is de favoriete muziek van elfen? Inpak-rap!","Geef iemand van wie je houdt een knuffel"],["Elf Belletje","Waarom ging de Kerstman naar de dokter? Zijn ho-ho-ho's waren schor!","Maak een kerstversiering"],["Elf Kaneel","Waarom is de kat zo blij met kerst? Overal staan doosjes!","Zeg vandaag drie keer dankjewel"],["Elf Sprankel","Hoe noem je de Kerstman als hij stilstaat? Een kerstpauze!","Schrijf of teken een kerstkaart voor iemand"],["Elf Nootmuskaat","Waarom ging de peperkoekman naar de dokter? Hij voelde zich kruimelig!","Help kerststol bakken of iets in de keuken klaarmaken"],["Elf Hulst","Hoe noem je een sneeuwpop in juli? Een plas!","Drink een extra glas water als een gezonde elf"],["Elf Slinger","Wat zeggen rendieren voor een grap? Houd je vast – dit gaat als een slee!","Zing een kerstlied hardop"],["Elf Bal","Waarom is het zo koud met kerst? Omdat het decembrrr is!","Geef iemand een echt compliment"],["Elf Vries","Hoe reizen sneeuwpoppen? Met een ijs-fiets!","Ga 15 minuten naar buiten in de frisse lucht"],["Elf Pudding","Waar bewaren sneeuwpoppen hun geld? In een sneeuwbank!","Lees 10 minuten een verhaal"],["Elf Gember","Hoe noem je een rendier zonder ogen? Geen idee!","Maak je bed helemaal zelf op"],["Elf Glitter","Wat is het favoriete vak van elfen? Elf-gebra!","Deel een speeltje of een snoepje met iemand"],["Elf Snoep","Waarom ging de kerstboom naar de kapper? Hij moest getrimd worden!","Vertel iemand één ding waar je dankbaar voor bent"],["Elf Cacao","Wat is rood en wit en rood en wit en rood en wit? De Kerstman die van een heuvel rolt!","Zet je schoenen en jas netjes weg"],["Elf Marsepein","Wat zei de grote kaars tegen de kleine kaars? Ik ga vanavond uit!","Doe een vriendelijk gebaar zonder dat iemand erom vraagt"],["Elf Sneeuwbal","Wat krijg je als je kerstversiering opeet? Slinger-itis!","Bouw iets van blokken, papier of sneeuw"],["Elf Peper","Waarom eet de Kerstman zo graag kerststol? Daar zit al een verrassing in!","Bel of app een opa, oma of een vriend"],["Elf Wafel","Wat is het beste kerstcadeau? Een kapotte trommel – je kunt 'm niet meer slaan!","Help een cadeau in te pakken"],["Elf Esdoorn","Wat zei de ene sneeuwpop tegen de andere? Ruik jij ook wortels?","Teken je mooiste kerstherinnering"],["Elf Koekje","Waarom zat de kalkoen in de band? Omdat hij al drumsticks had!","Kies één speeltje om aan iemand anders te geven"],["Elf Drop","Wat krijg je als je de Kerstman met een eend kruist? Een kerstkwaker!","Vertel iemand een grap om te laten lachen"],["Elf IJspegel","Wat zei de kerststol tegen het mes? Snijd maar – ik zit vol amandelspijs!","Doe 10 jumping jacks zoals de elfjes in opleiding"],["Elf Fudge","Waarom voelde het hulpje van de Kerstman zich somber? Hij had last van een laag elfvertrouwen!","Poets je tanden extra goed – de elfen controleren!"],["Elf Wanten","Hoe noem je een rendier met oorkappen? Wat je wilt – hij hoort je niet!","Help iemand iets te tillen"],["Elf Veenbes","Hoeveel cadeaus passen in de lege zak van de Kerstman? Maar één – daarna is hij niet meer leeg!","Zeg de hele dag alsjeblieft en dankjewel"],["Elf Pepermunt","Welk rendier van de Kerstman heeft de slechtste manieren? Lomp-dolf!","Houd een uur zonder scherm"],["Elf Steranijs","Wat dragen sneeuwpoppen op hun hoofd? IJskapjes!","Dans op je lievelingslied"]],
  sl_title:"🛷 Arrenslee-tracker", sl_radar:"Elfenradar", sl_status:"Werkplaatsstatus", sl_demo_mode:"PROEFVLUCHT (gesimuleerd)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Cadeaus ingepakt","📜 Verlanglijstjes gelezen","🦌 Rendierenconditie","✨ Magisch stof in de tank","🍪 Koekjes geproefd"],
  sl_after_rows:["🎁 Cadeaus bezorgd","😴 De Kerstman","🦌 Rendieren in de stal"],
  sl_after:"🎅 De Kerstman slaapt weer lekker uit thuis. Dankjewel voor dit jaar! 💤",
  sl_parked:"🛷 De arrenslee staat geparkeerd op de Noordpool. Op {date} kun je hem hier live volgen – aankomst bij {home} rond {eta}.",
  sl_pre:"🛷 De arrenslee wordt geladen op de Noordpool… vertrek om {t}", sl_done:"🏁 De Kerstman is weer geland op de Noordpool. Welterusten! 💤",
  sl_land:"📍 De Kerstman landt in <b>{a}</b>", sl_fly:"✈️ Vliegt van <b>{a}</b> naar <b>{b}</b>", sl_here:"🎅🏠 De Kerstman is nu in <b>{home}</b>! Kijk uit het raam ✨",
  sl_in_h:"over {h} u {m} min", sl_in_m:"over {m} min!", sl_now:"NU! 👀 Kijk uit het raam!", sl_been:"Is hier al geweest ✔",
  sl_gifts:"🎁 Cadeaus bezorgd: {n} miljoen", sl_speed:"⚡ Snelheid: {s} km/s", sl_rudolf:"🦌 Rudolf: schijnt helder", sl_eta:"🏠 Aankomst {home}",
  sl_hint:"houd de titel ingedrukt voor een proefvlucht ✈️", sl_np:"Noordpool", sl_home:"Thuis",
  sl_news:["De elfen lakken de laatste hobbelpaarden 🐴","Rudolf oefent landingen op daken 🏠","Mevrouw Kerstman proeft een plakje kerststol 🍞","Er komen nieuwe bellen aan de arrenslee 🔔","De elfen sorteren verlanglijstjes 📜","Inpakpapier: 4.812 km uitgerold 🎁","De Kerstman past zijn nieuwe rode pak 🎅","De rendieren krijgen extra haver 🌾","De oliebollenpan staat al klaar voor oud en nieuw 🍩","De GPS van de arrenslee krijgt nieuwe kaarten 🗺️"],
  tab_sleigh:"Slee", tab_nice:"Lief", tab_elf:"Elf", locale:"nl-NL"
 },
 fi: {
  hero_title:"🎅 Pohjoisnapa", hero_sub:"Joulupukin salainen valvomo", until:"⏳ Jouluaattoon",
  u_d:"päivää", u_h:"tuntia", u_m:"min", u_s:"sek",
  n_many:"{n} yötä jäljellä", n_one:"Vain 1 yö jäljellä! 😴", n_zero:"Joulupukki tulee tänä iltana! 🎅", n_title:"{n} yötä",
  party:"🎉 Hyvää joulua! 🎉", party_sub:"Joulupukki on käynyt – kurkista kuusen alle! 🎁",
  cam_title:"📹 Pohjoisnavan kamerat", cam_live:"● LIVE", cam_tap:"napauta koko näytölle", cam_lost:"⚠ SIGNAALI KADONNUT", cam_restore:"yhdistetään uudelleen…",
  cam_lost_label:"CAM 01 – JOULUPUKIN TOIMISTO", cam_foot:"🔒 Salainen tonttukamera · vain kilttejä lapsia varten", cam_close:"napauta sulkeaksesi ✕",
  periods:{morning:"🌅 aamu",day:"☀️ päivä",evening:"🌙 ilta",morgen:"🌅 aamu",dag:"☀️ päivä",aften:"🌙 ilta"},
  nice_title:"⭐ Kilttilista", nice_sub:"Joulupukin muistikirja", parent:"🔓 Vanhempien tila (sulkeutuu 2 min kuluttua)",
  why:"Mitä tapahtui? (esim. auttoi kattamaan pöydän)", log_title:"📜 Tonttuloki", no_log:"Ei merkintöjä vielä…", hold:"🔒 pidä otsikkoa painettuna 1 s.",
  lv:["Voi ei… kiviä sukkaan? 🪨","Tontut tarkkailevat 👀","Melkein kiltti 🙂","Kiltti ⭐","SUPER-kiltti 🌟"],
  reset:"🔄 Nollaa kilttilista", reset_q:"Nollataanko kilttilista?",
  reset_txt:"Jokainen lapsi palaa aloituspisteisiin, ja tonttuloki alkaa alusta.",
  yes_reset:"Kyllä, nollaa", cancel:"Peruuta", new_start:"Uusi alku – tontut tarkkailevat! 👀",
  edit:"✏️ Muokkaa lapsia", edit_done:"✔ Valmis", e_emoji:"Emoji", e_name:"Nimi", e_start:"Alku", add:"➕ Lisää", save:"💾", del:"🗑",
  del_q:"Poistetaanko {name}?", del_txt:"{name} poistetaan kilttilistalta. Tätä ei voi perua.", yes_del:"Kyllä, poista", new_name:"Uusi lapsi",
  no_kids:"Listalla ei ole vielä lapsia.", add_kid:"➕ Lisää lapsi", loading:"Haetaan lapsia joulupukin muistikirjasta…",
  load_err:"Lapsia ei voitu ladata lähteestä {store}: {err}",
  no_entity:"ei ole olemassa Home Assistantissa", retry:"🔄 Yritä uudelleen",
  stale:"🔄 Uusi Nordpol-versio – sivu ladataan uudelleen…",
  no_store:"Luo <b>Local To-do</b>-lista nimeltä <code>Nordpol nice list</code> tai valitse tehtävälista kortin visuaalisessa editorissa.",
  elf_title:"🧝 Päivän tonttu", elf_date:"{d}. joulukuuta",
  elf_trial:"Harjoitustonttu (oikea tonttu saapuu 1. joulukuuta)",
  elf_duty:"päivystävä tonttu tänään", elf_joke:"Päivän tonttuvitsi:", elf_tap:"(napauta nähdäksesi vastauksen)", elf_task:"Päivän tonttutehtävä:",
  elves:[["Tonttu Pipsa","Mikä on tonttujen lempiaine koulussa? Korvatunturin aakkoset!","Piirrä joulutähti"],["Tonttu Hiutale","Miksi porot laulavat niin hyvin? Koska niillä on täydellinen korva – Korvatunturin korva!","Auta kattamaan pöytä"],["Tonttu Tahma","Mitä lumiukot syövät aamupalaksi? Lumihiutaleita!","Siivoa huoneesi"],["Tonttu Puuro","Mikä on tonttujen lempimusiikki? Paketti-räppi!","Anna rakkaalle ihmiselle halaus"],["Tonttu Kulkunen","Miksi joulupukki meni lääkäriin? Hänen ho-ho-honsa olivat käheät!","Tee joulukoriste"],["Tonttu Kaneli","Mikä on kissa rannalla jouluna? Hiekkapukki!","Sano kiitos kolme kertaa tänään"],["Tonttu Kipinä","Mikä on joulupukki, kun hän pysähtyy? Joulupukkipaussi!","Kirjoita tai piirrä joulukortti jollekulle"],["Tonttu Muskotti","Miksi piparkakku-ukko meni lääkäriin? Hän oli ihan muruina!","Auta leipomaan piparkakkuja"],["Tonttu Orjanlaakeri","Mikä on lumiukko heinäkuussa? Lätäkkö!","Juo ylimääräinen lasillinen vettä kuin kiltti tonttu"],["Tonttu Hopealanka","Mitä porot sanovat ennen vitsiä? Tämä naurattaa sinut rekivauhdilla!","Laula joululaulu ääneen"],["Tonttu Pallo","Miksi jouluna on niin kylmä? Koska on joulukuu – ja kuu on jäässä!","Anna jollekulle aito kehu"],["Tonttu Huurre","Miten lumiukot matkustavat? Jääpyörällä!","Mene ulos raittiiseen ilmaan 15 minuutiksi"],["Tonttu Vanukas","Missä lumiukot säilyttävät rahansa? Lumipankissa!","Lue tarina 10 minuuttia"],["Tonttu Inkivääri","Mikä on poro ilman silmiä? Ei aavistustakaan!","Petaa sänkysi ihan itse"],["Tonttu Säihke","Mikä on tonttujen lempiaine? Tonttumatiikka!","Jaa lelu tai herkku jonkun kanssa"],["Tonttu Karamelli","Miksi joulukuusi meni kampaajalle? Se tarvitsi leikkauksen!","Kerro jollekulle yksi asia, josta olet kiitollinen"],["Tonttu Kaakao","Mikä on punaista ja valkoista ja punaista ja valkoista ja punaista ja valkoista? Joulupukki, joka vierii mäkeä alas!","Laita kengät ja takki siististi paikoilleen"],["Tonttu Marsipaani","Mitä iso kynttilä sanoi pienelle? Minä sammun tänä iltana!","Tee ystävällinen palvelus pyytämättä"],["Tonttu Lumipallo","Mitä saat, jos syöt joulukoristeita? Hopealankatulehduksen!","Rakenna jotain palikoista, paperista tai lumesta"],["Tonttu Pippuri","Miksi joulupukki tykkää joulupuurosta? Koska sieltä voi löytyä manteli!","Soita tai viestitä isovanhemmalle tai kaverille"],["Tonttu Vohveli","Mikä on paras joululahja? Rikkoutunut rumpu – lyömätön lahja!","Auta paketoida lahja"],["Tonttu Vaahtera","Mitä yksi lumiukko sanoi toiselle? Haistatko sinäkin porkkanoita?","Piirrä mieluisin joulumuistosi"],["Tonttu Keksi","Miksi joulutortut jonottivat uuniin? Ne odottivat tähtikeikkaa!","Valitse yksi lelu annettavaksi jollekulle toiselle"],["Tonttu Laku","Mitä syntyy, kun risteytät joulupukin ja ankan? Jouluvaakkuja!","Kerro jollekulle vitsi, jotta hän nauraa"],["Tonttu Jääpuikko","Mitä piparkakku sanoi uunille? Älä paista liikaa – haluan pysyä piparina, en hiilenä!","Etsi manteli joulupuurosta"],["Tonttu Toffee","Miksi tonttuapu oli hetken down? Hänellä oli matala tonttuitsetunto!","Harjaa hampaat erityisen hyvin – tontut tarkistavat!"],["Tonttu Lapaset","Mikä on poro, jolla on korvaläpät? Ihan mitä vain – se ei kuule sinua!","Auta jotakuta kantamaan jotain"],["Tonttu Puolukka","Montako lahjaa mahtuu joulupukin tyhjään säkkiin? Vain yksi – sen jälkeen se ei ole tyhjä!","Sano ole hyvä ja kiitos koko päivän"],["Tonttu Piparminttu","Millä joulupukin poroista on huonoimmat tavat? Törttö-dolf!","Pidä tunti ilman ruutua"],["Tonttu Manteli","Mitä lumiukot pitävät päässään? Napalakkeja!","Tanssi lempikappaleesi tahtiin"]],
  sl_title:"🛷 Rekiseuranta", sl_radar:"Tonttututka", sl_status:"Pajan tilanne", sl_demo_mode:"KOELENTO (simuloitu)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Lahjat paketoitu","📜 Toivelistat luettu","🦌 Porojen kunto","✨ Taikapölyä tankissa","🍪 Piparit maistettu"],
  sl_after_rows:["🎁 Lahjat toimitettu","😴 Joulupukki","🦌 Porot tallissa"],
  sl_after:"🎅 Joulupukki nukkuu taas kotona pitkään. Kiitos tästä vuodesta! 💤",
  sl_parked:"🛷 Reki on pysäköity Pohjoisnavalle. {date} voit seurata sitä täällä livenä – sen pitäisi saapua kohteeseen {home} noin {eta}.",
  sl_pre:"🛷 Rekeä lastataan Pohjoisnavalla… lähtö klo {t}", sl_done:"🏁 Joulupukki on laskeutunut taas Pohjoisnavalle. Hyvää yötä! 💤",
  sl_land:"📍 Joulupukki laskeutuu kohteeseen <b>{a}</b>", sl_fly:"✈️ Lennossa kohteesta <b>{a}</b> kohteeseen <b>{b}</b>", sl_here:"🎅🏠 Joulupukki on juuri nyt paikassa <b>{home}</b>! Katso ikkunasta ✨",
  sl_in_h:"{h} t {m} min päästä", sl_in_m:"{m} min päästä!", sl_now:"NYT! 👀 Katso ikkunasta!", sl_been:"Käynyt täällä jo ✔",
  sl_gifts:"🎁 Lahjoja toimitettu: {n} miljoonaa", sl_speed:"⚡ Nopeus: {s} km/s", sl_rudolf:"🦌 Rudolf: loistaa kirkkaasti", sl_eta:"🏠 Saapuminen {home}",
  sl_hint:"pidä otsikkoa pohjassa koelentoa varten ✈️", sl_np:"Pohjoisnapa", sl_home:"Koti",
  sl_news:["Tontut maalaavat viimeisiä keinuhevosia 🐴","Rudolf harjoittelee laskeutumista katoille 🏠","Joulumuori testailee uusia pipareita 🍪","Joulupukki tarkistaa reittinsä Korvatunturilla 🗺️","Tontut järjestävät toivelistoja 📜","Paketointipaperia: 4 812 km rullattuna 🎁","Joulupukki sovittaa uutta punaista nuttuaan 🎅","Joulupuuro porisee ja manteli on piilossa 🍚","Joulusauna lämpenee 🔥","Reen GPS saa uudet kartat 🗺️"],
  tab_sleigh:"Reki", tab_nice:"Kiltti", tab_elf:"Tonttu", locale:"fi-FI"
 },
 pl: {
  hero_title:"🎅 Biegun Północny", hero_sub:"Tajna sterownia Świętego Mikołaja", until:"⏳ Wigilia za",
  u_d:"dni", u_h:"godz.", u_m:"min", u_s:"sek",
  n_many:"zostało {n} nocy", n_one:"Została tylko 1 noc! 😴", n_zero:"Święty Mikołaj przychodzi dziś wieczorem! 🎅", n_title:"{n} nocy",
  party:"🎉 Wesołych Świąt! 🎉", party_sub:"Święty Mikołaj tu był – zajrzyj pod choinkę! 🎁",
  cam_title:"📹 Kamery Bieguna Północnego", cam_live:"● NA ŻYWO", cam_tap:"dotknij, aby otworzyć pełny ekran", cam_lost:"⚠ UTRATA SYGNAŁU", cam_restore:"ponowne łączenie…",
  cam_lost_label:"CAM 01 – BIURO ŚWIĘTEGO MIKOŁAJA", cam_foot:"🔒 Tajna kamera elfów · tylko dla grzecznych dzieci", cam_close:"dotknij, aby zamknąć ✕",
  periods:{morning:"🌅 poranek",day:"☀️ dzień",evening:"🌙 wieczór",morgen:"🌅 poranek",dag:"☀️ dzień",aften:"🌙 wieczór"},
  nice_title:"⭐ Lista grzecznych", nice_sub:"Notatnik Świętego Mikołaja", parent:"🔓 Tryb rodzica (zamyka się po 2 min)",
  why:"Co się stało? (np. pomógł nakryć do stołu)", log_title:"📜 Dziennik elfów", no_log:"Na razie brak notatek…", hold:"🔒 przytrzymaj tytuł przez 1 s.",
  lv:["Ojej… węgiel w skarpecie? 🪨","Elfy patrzą 👀","Prawie grzeczny 🙂","Grzeczny ⭐","SUPER-grzeczny 🌟"],
  reset:"🔄 Resetuj listę grzecznych", reset_q:"Zresetować listę grzecznych?",
  reset_txt:"Każde dziecko wraca do swojej punktacji startowej, a dziennik elfów zaczyna się od nowa.",
  yes_reset:"Tak, resetuj", cancel:"Anuluj", new_start:"Nowy start – elfy patrzą! 👀",
  edit:"✏️ Edytuj dzieci", edit_done:"✔ Gotowe", e_emoji:"Emoji", e_name:"Imię", e_start:"Start", add:"➕ Dodaj", save:"💾", del:"🗑",
  del_q:"Usunąć {name}?", del_txt:"{name} zostanie usunięte z listy grzecznych. Tej operacji nie można cofnąć.", yes_del:"Tak, usuń", new_name:"Nowe dziecko",
  no_kids:"Na liście nie ma jeszcze dzieci.", add_kid:"➕ Dodaj dziecko", loading:"Pobieranie dzieci z notatnika Świętego Mikołaja…",
  load_err:"Nie udało się wczytać dzieci z {store}: {err}",
  no_entity:"nie istnieje w Home Assistant", retry:"🔄 Spróbuj ponownie",
  stale:"🔄 Nowa wersja Nordpol – odświeżanie strony…",
  no_store:"Utwórz listę <b>Local To-do</b> o nazwie <code>Nordpol nice list</code> albo wybierz listę zadań w wizualnym edytorze karty.",
  elf_title:"🧝 Elf dnia", elf_date:"{d} grudnia",
  elf_trial:"Elf na próbę (prawdziwy elf przychodzi 1 grudnia)",
  elf_duty:"elf na służbie dzisiaj", elf_joke:"Żart elfa dnia:", elf_tap:"(dotknij, aby zobaczyć odpowiedź)", elf_task:"Zadanie elfa dnia:",
  elves:[["Elf Pip","Czego elfy uczą się w szkole? Pakowania na szóstkę!","Narysuj świąteczną gwiazdę"],["Elf Płatek","Dlaczego renifery tak dobrze śpiewają? Bo zawsze trafiają w róg!","Pomóż nakryć do Wigilii i zostaw wolne miejsce"],["Elf Kleik","Co jedzą bałwany na śniadanie? Płatki śniegu!","Posprzątaj swój pokój"],["Elf Kasza","Jaka jest ulubiona muzyka elfów? Owija-rap!","Przytul kogoś, kogo lubisz"],["Elf Dzwoneczek","Dlaczego Święty Mikołaj poszedł do lekarza? Bo jego ho-ho-ho było zachrypnięte!","Zrób świąteczną ozdobę"],["Elf Cynamon","Dlaczego kot tak lubi święta? Bo wszędzie stoi mnóstwo pudełek!","Powiedz dzisiaj dziękuję trzy razy"],["Elf Iskierka","Jak nazywa się Święty Mikołaj, gdy stanie w miejscu? Mikołaj-pauza!","Napisz lub narysuj kartkę świąteczną dla kogoś"],["Elf Gałka","Dlaczego piernikowy ludzik poszedł do lekarza? Bo czuł się pokruszony!","Pomóż lepić pierogi"],["Elf Ostrokrzew","Jak nazywa się bałwan w lipcu? Kałuża!","Wypij dodatkową szklankę wody jak grzeczny elf"],["Elf Sople","Co mówią renifery przed żartem? Ten żart zwali cię z sań!","Zaśpiewaj kolędę na głos"],["Elf Bombka","Dlaczego w święta jest tak zimno? Bo w grudniu aż zęby szczękają: brrr!","Zrób komuś szczery komplement"],["Elf Mróz","Jak podróżują bałwany? Na lodowym rowerze!","Wyjdź na świeże powietrze na 15 minut"],["Elf Pudding","Gdzie bałwany trzymają pieniądze? W śnieżnym banku!","Poczytaj historię przez 10 minut"],["Elf Imbir","Jak nazywa się renifer bez oczu? Nie mam pojęcia!","Pościel łóżko całkiem sam"],["Elf Blask","Jaki jest ulubiony przedmiot elfów? Elf-ematyka!","Podziel się zabawką albo smakołykiem"],["Elf Cukierek","Dlaczego choinka poszła do fryzjera? Bo potrzebowała przycięcia!","Powiedz komuś jedną rzecz, za którą jesteś wdzięczny"],["Elf Kakao","Co jest czerwono-białe, czerwono-białe i znów czerwono-białe? Mikołaj staczający się ze wzgórza!","Schowaj buty i kurtkę na miejsce"],["Elf Marcepan","Co duża świeca powiedziała małej? Dziś zgasnę wieczorem!","Zrób komuś przysługę, zanim cię poproszą"],["Elf Śnieżka","Co dostaniesz, gdy zjesz ozdoby choinkowe? Łańcuchowicę!","Zbuduj coś z klocków, papieru albo śniegu"],["Elf Pieprz","Co robi Mikołaj, gdy zgubi opłatek? Łamie się… ze śmiechu!","Zadzwoń lub napisz do dziadka, babci albo kolegi"],["Elf Gofrownik","Jaki prezent jest najlepszy? Zepsuty bęben – nie pobijesz tego!","Pomóż zapakować prezent"],["Elf Klon","Co jeden bałwan powiedział drugiemu? Też czujesz zapach marchewek?","Narysuj swoje ulubione świąteczne wspomnienie"],["Elf Herbatnik","Dlaczego pierogi poszły na koncert? Bo były już dobrze zlepione w zespół!","Wybierz jedną zabawkę, którą możesz komuś oddać"],["Elf Żelka","Co powstanie z Mikołaja i kaczki? Świąteczny kwakacz!","Opowiedz komuś dowcip, żeby się roześmiał"],["Elf Sopel","Co powiedział opłatek do opłatka? Łamiemy się – i składamy życzenia!","Wypatrz pierwszą gwiazdkę"],["Elf Kajmak","Dlaczego pomocnik Mikołaja był smutny? Miał niskie poczucie elfowartości!","Umyj zęby szczególnie starannie – elfy sprawdzają!"],["Elf Rękawiczka","Jak nazywa się renifer w nausznikach? Jak chcesz – i tak cię nie słyszy!","Pomóż komuś coś przenieść"],["Elf Żurawina","Ile prezentów zmieści się w pustym worku Świętego Mikołaja? Tylko jeden – potem już nie jest pusty!","Mów proszę i dziękuję przez cały dzień"],["Elf Mięta","Który renifer Mikołaja ma najgorsze maniery? Niegrzecz-dolf!","Spędź godzinę bez ekranu"],["Elf Migdałek","Co bałwany noszą na głowie? Czapy lodowe!","Zatańcz do swojej ulubionej piosenki"]],
  sl_title:"🛷 Śledzenie sań", sl_radar:"Radar elfów", sl_status:"Status warsztatu", sl_demo_mode:"LOT PRÓBNY (symulacja)", sl_live:"NA ŻYWO {date}",
  sl_rows:["🎁 Prezenty zapakowane","📜 Listy życzeń przeczytane","🦌 Kondycja reniferów","✨ Magiczny pył w baku","🍪 Ciasteczka spróbowane"],
  sl_after_rows:["🎁 Prezenty doręczone","😴 Święty Mikołaj","🦌 Renifery w stajni"],
  sl_after:"🎅 Święty Mikołaj śpi już w domu do późna. Dzięki za ten rok! 💤",
  sl_parked:"🛷 Sanie stoją na Biegunie Północnym. {date} możesz śledzić je tutaj na żywo – do {home} powinny dotrzeć około {eta}.",
  sl_pre:"🛷 Sanie są ładowane na Biegunie Północnym… wylot o {t}", sl_done:"🏁 Święty Mikołaj wylądował z powrotem na Biegunie Północnym. Dobranoc! 💤",
  sl_land:"📍 Święty Mikołaj ląduje w: <b>{a}</b>", sl_fly:"✈️ Leci z <b>{a}</b> do <b>{b}</b>", sl_here:"🎅🏠 Święty Mikołaj jest teraz w <b>{home}</b>! Wyjrzyj przez okno ✨",
  sl_in_h:"za {h} godz. {m} min", sl_in_m:"za {m} min!", sl_now:"TERAZ! 👀 Wyjrzyj przez okno!", sl_been:"Już tu był ✔",
  sl_gifts:"🎁 Doręczone prezenty: {n} mln", sl_speed:"⚡ Prędkość: {s} km/s", sl_rudolf:"🦌 Rudolf: świeci jasno", sl_eta:"🏠 Przyjazd {home}",
  sl_hint:"przytrzymaj tytuł, aby zrobić lot próbny ✈️", sl_np:"Biegun Północny", sl_home:"Dom",
  sl_news:["Elfy malują ostatnie koniki na biegunach 🐴","Rudolf ćwiczy lądowania na dachach 🏠","W kuchni pachnie pierogami na Wigilię 🥟","Elfy przygotowują opłatki do składania życzeń ✨","Elfy sortują listy z życzeniami 📜","Papier do pakowania: 4 812 km rozwinięte 🎁","Święty Mikołaj przymierza nowy czerwony strój 🎅","Renifery dostają dodatkowy owies 🌾","Wolne miejsce przy wigilijnym stole jest już nakryte 🍽️","GPS sań pobiera nowe mapy 🗺️"],
  tab_sleigh:"Sanie", tab_nice:"Grzeczni", tab_elf:"Elf", locale:"pl-PL"
 },
 it: {
  hero_title:"🎅 Polo Nord", hero_sub:"La stanza di controllo segreta di Babbo Natale", until:"⏳ Natale tra",
  u_d:"giorni", u_h:"ore", u_m:"min", u_s:"sec",
  n_many:"{n} notti rimaste", n_one:"Solo 1 notte rimasta! 😴", n_zero:"Babbo Natale arriva stanotte! 🎅", n_title:"{n} notti",
  party:"🎉 Buon Natale! 🎉", party_sub:"Babbo Natale è passato – guarda sotto l'albero! 🎁",
  cam_title:"📹 Telecamere del Polo Nord", cam_live:"● LIVE", cam_tap:"tocca per lo schermo intero", cam_lost:"⚠ SEGNALE PERSO", cam_restore:"riconnessione…",
  cam_lost_label:"CAM 01 – UFFICIO DI BABBO NATALE", cam_foot:"🔒 Telecamera segreta degli elfi · solo per i bambini buoni", cam_close:"tocca per chiudere ✕",
  periods:{morning:"🌅 mattina",day:"☀️ giorno",evening:"🌙 sera",morgen:"🌅 mattina",dag:"☀️ giorno",aften:"🌙 sera"},
  nice_title:"⭐ Lista dei buoni", nice_sub:"Il taccuino di Babbo Natale", parent:"🔓 Modalità genitori (si chiude dopo 2 min)",
  why:"Cos'è successo? (es. ha aiutato a apparecchiare)", log_title:"📜 Diario degli elfi", no_log:"Ancora nessuna nota…", hold:"🔒 tieni premuto il titolo per 1 sec.",
  lv:["Uh-oh… carbone nella calza? 🪨","Gli elfi stanno guardando 👀","Quasi buono 🙂","Buono ⭐","SUPER buono 🌟"],
  reset:"🔄 Reimposta la lista dei buoni", reset_q:"Reimpostare la lista dei buoni?",
  reset_txt:"Ogni bambino torna al punteggio iniziale e il diario degli elfi riparte da capo.",
  yes_reset:"Sì, reimposta", cancel:"Annulla", new_start:"Nuovo inizio – gli elfi stanno guardando! 👀",
  edit:"✏️ Modifica bambini", edit_done:"✔ Fatto", e_emoji:"Emoji", e_name:"Nome", e_start:"Inizio", add:"➕ Aggiungi", save:"💾", del:"🗑",
  del_q:"Eliminare {name}?", del_txt:"{name} verrà rimosso dalla lista dei buoni. L'operazione non si può annullare.", yes_del:"Sì, elimina", new_name:"Nuovo bambino",
  no_kids:"Non ci sono ancora bambini in lista.", add_kid:"➕ Aggiungi bambino", loading:"Recupero i bambini dal taccuino di Babbo Natale…",
  load_err:"Impossibile caricare i bambini da {store}: {err}",
  no_entity:"non esiste in Home Assistant", retry:"🔄 Riprova",
  stale:"🔄 Nuova versione di Nordpol – ricarico la pagina…",
  no_store:"Crea un elenco <b>Local To-do</b> chiamato <code>Nordpol nice list</code>, oppure scegli un elenco nell'editor visivo della scheda.",
  elf_title:"🧝 Elfo del giorno", elf_date:"{d} dicembre",
  elf_trial:"Elfo in prova (l'elfo vero arriva il 1° dicembre)",
  elf_duty:"elfo di turno oggi", elf_joke:"Barzelletta dell'elfo del giorno:", elf_tap:"(tocca per la risposta)", elf_task:"Compito dell'elfo del giorno:",
  elves:[["Elfo Pipo","Cosa imparano gli elfi a scuola? L'elfabeto!","Disegna una stella di Natale"],["Elfo Fiocco","Perché le renne cantano così bene? Perché sono delle vere coriste!","Aiuta a apparecchiare la tavola"],["Elfo Appiccicoso","Cosa mangiano i pupazzi di neve a colazione? I fiocchi di neve!","Riordina la tua stanza"],["Elfo Pappa","Qual è la musica preferita degli elfi? Il rappacchi!","Fai un grande abbraccio a qualcuno che ami"],["Elfo Campanella","Perché Babbo Natale è andato dal dottore? Aveva il rauco ho-ho-ho!","Prepara una decorazione di Natale"],["Elfo Cannella","Perché il gatto adora il Natale? Ci sono scatole ovunque!","Di' grazie tre volte oggi"],["Elfo Scintilla","Come si chiama Babbo Natale quando si ferma? Babbo Pausa!","Scrivi o disegna un biglietto di Natale per qualcuno"],["Elfo Noce Moscata","Perché l'omino di pan di zenzero è andato dal medico? Si sentiva tutto a briciole!","Aiuta a preparare qualcosa in cucina"],["Elfo Agrifoglio","Come si chiama un pupazzo di neve a luglio? Una pozzanghera!","Bevi un bicchiere d'acqua in più come un elfo in salute"],["Elfo Festone","Cosa dicono le renne prima di una barzelletta? Questa ti fa slittare dal ridere!","Canta una canzone di Natale ad alta voce"],["Elfo Pallina","Perché fa così freddo a Natale? Perché è dicem-brrr!","Fai a qualcuno un complimento sincero"],["Elfo Gelo","Come viaggiano i pupazzi di neve? In ghiaccio-cletta!","Esci all'aria aperta per 15 minuti"],["Elfo Budino","Dove tengono i soldi i pupazzi di neve? In una banca di neve!","Leggi una storia per 10 minuti"],["Elfo Zenzero","Come si chiama una renna senza occhi? Non ho idea!","Fai il letto tutto da solo"],["Elfo Luccichio","Qual è la materia preferita degli elfi? L'elfebra!","Condividi un giocattolo o una leccornia con qualcuno"],["Elfo Caramella","Perché l'albero di Natale è andato dal parrucchiere? Aveva bisogno di una spuntatina!","Racconta a qualcuno una cosa per cui sei grato"],["Elfo Cacao","Cos'è rosso e bianco e rosso e bianco e rosso e bianco? Babbo Natale che rotola giù dalla collina!","Metti a posto scarpe e giacca con ordine"],["Elfo Marzapane","Cosa ha detto la candela grande a quella piccola? Stasera mi spengo!","Fai un favore gentile senza che te lo chiedano"],["Elfo Palla di Neve","Cosa prendi se mangi le decorazioni? La feston-ite!","Costruisci qualcosa con mattoncini, carta o neve"],["Elfo Pepe","Perché Babbo Natale ama il panettone? Perché è già pieno di sorprese!","Chiama o scrivi a un nonno, una nonna o un amico"],["Elfo Cialda","Qual è il miglior regalo di Natale? Un tamburo rotto – non si può battere!","Aiuta a incartare un regalo"],["Elfo Acero","Cosa ha detto un pupazzo di neve all'altro? Senti anche tu odore di carote?","Disegna il tuo ricordo di Natale preferito"],["Elfo Biscotto","Perché il panettone suonava in una band? Perché era già pieno di canditi e di ritmo!","Scegli un giocattolo da regalare a qualcun altro"],["Elfo Gelatina","Cosa ottieni incrociando Babbo Natale e un'anatra? Un qua-qua di Natale!","Racconta una barzelletta a qualcuno per farlo ridere"],["Elfo Ghiacciolo","Cosa dice il presepe ai pastori? State buoni, che arriva Babbo Natale!","Aiuta a sistemare il presepe"],["Elfo Toffee","Perché l'aiutante di Babbo Natale era giù? Aveva poca elfostima!","Lavati i denti extra bene – gli elfi controllano!"],["Elfo Muffola","Come chiami una renna con i paraorecchie? Come vuoi – non ti sente!","Aiuta qualcuno a portare qualcosa"],["Elfo Mirtillo","Quanti regali entrano nel sacco vuoto di Babbo Natale? Solo uno – dopo non è più vuoto!","Di' per favore e grazie tutto il giorno"],["Elfo Menta","Quale renna di Babbo Natale ha le peggiori maniere? Maleducolfo!","Passa un'ora senza schermo"],["Elfo Mandorla","Cosa portano in testa i pupazzi di neve? Le calotte glaciali!","Balla la tua canzone preferita"]],
  sl_title:"🛷 Tracciamento della slitta", sl_radar:"Radar degli elfi", sl_status:"Stato del laboratorio", sl_demo_mode:"VOLO DI PROVA (simulato)", sl_live:"LIVE {date}",
  sl_rows:["🎁 Regali impacchettati","📜 Liste dei desideri lette","🦌 Forma delle renne","✨ Polvere magica nel serbatoio","🍪 Biscotti assaggiati"],
  sl_after_rows:["🎁 Regali consegnati","😴 Babbo Natale","🦌 Renne nella stalla"],
  sl_after:"🎅 Babbo Natale è di nuovo a casa a dormire a lungo. Grazie per quest'anno! 💤",
  sl_parked:"🛷 La slitta è parcheggiata al Polo Nord. Il {date} potrai seguirla dal vivo qui – dovrebbe arrivare a {home} verso le {eta}.",
  sl_pre:"🛷 La slitta viene caricata al Polo Nord… partenza alle {t}", sl_done:"🏁 Babbo Natale è atterrato di nuovo al Polo Nord. Buonanotte! 💤",
  sl_land:"📍 Babbo Natale sta atterrando a <b>{a}</b>", sl_fly:"✈️ In volo da <b>{a}</b> a <b>{b}</b>", sl_here:"🎅🏠 Babbo Natale è a <b>{home}</b> proprio ora! Guarda dalla finestra ✨",
  sl_in_h:"tra {h} h {m} min", sl_in_m:"tra {m} min!", sl_now:"ORA! 👀 Guarda dalla finestra!", sl_been:"È già passato di qui ✔",
  sl_gifts:"🎁 Regali consegnati: {n} milioni", sl_speed:"⚡ Velocità: {s} km/s", sl_rudolf:"🦌 Rudolf: brilla intensamente", sl_eta:"🏠 Arrivo {home}",
  sl_hint:"tieni premuto il titolo per un volo di prova ✈️", sl_np:"Polo Nord", sl_home:"Casa",
  sl_news:["Gli elfi stanno dipingendo gli ultimi cavallini a dondolo 🐴","Rudolf si allena agli atterraggi sui tetti 🏠","Mamma Natale prova il panettone appena sfornato 🍞","Gli elfi stanno preparando il presepe 🏡","Gli elfi ordinano le liste dei desideri 📜","Carta da regalo: 4.812 km srotolati 🎁","Babbo Natale prova il suo nuovo vestito rosso 🎅","Le renne ricevono avena extra 🌾","La Befana controlla la scopa per l'Epifania 🧹","Il GPS della slitta scarica nuove mappe 🗺️"],
  tab_sleigh:"Slitta", tab_nice:"Buoni", tab_elf:"Elfo", locale:"it-IT"
 },
 pt: {
  hero_title:"🎅 Polo Norte", hero_sub:"A sala de controlo secreta do Pai Natal", until:"⏳ Natal daqui a",
  u_d:"dias", u_h:"horas", u_m:"min", u_s:"s",
  n_many:"faltam {n} noites", n_one:"Falta só 1 noite! 😴", n_zero:"O Pai Natal chega esta noite! 🎅", n_title:"{n} noites",
  party:"🎉 Feliz Natal! 🎉", party_sub:"O Pai Natal já passou – olha para debaixo da árvore! 🎁",
  cam_title:"📹 Câmaras do Polo Norte", cam_live:"● EM DIRETO", cam_tap:"toca para ecrã inteiro", cam_lost:"⚠ SINAL PERDIDO", cam_restore:"a religar…",
  cam_lost_label:"CAM 01 – GABINETE DO PAI NATAL", cam_foot:"🔒 Câmara secreta dos elfos · só para crianças bem-comportadas", cam_close:"toca para fechar ✕",
  periods:{morning:"🌅 manhã",day:"☀️ dia",evening:"🌙 noite",morgen:"🌅 manhã",dag:"☀️ dia",aften:"🌙 noite"},
  nice_title:"⭐ Lista dos bem-comportados", nice_sub:"O caderno do Pai Natal", parent:"🔓 Modo dos pais (fecha após 2 min)",
  why:"O que aconteceu? (p. ex. ajudou a pôr a mesa)", log_title:"📜 Diário dos elfos", no_log:"Ainda não há notas…", hold:"🔒 mantém o título premido durante 1 s.",
  lv:["Uh-oh… carvão na meia? 🪨","Os elfos estão a ver 👀","Quase bem-comportado 🙂","Bem-comportado ⭐","SUPER bem-comportado 🌟"],
  reset:"🔄 Repor a lista dos bem-comportados", reset_q:"Repor a lista dos bem-comportados?",
  reset_txt:"Cada criança volta à pontuação inicial e o diário dos elfos recomeça.",
  yes_reset:"Sim, repor", cancel:"Cancelar", new_start:"Recomeço – os elfos estão a ver! 👀",
  edit:"✏️ Editar crianças", edit_done:"✔ Concluído", e_emoji:"Emoji", e_name:"Nome", e_start:"Início", add:"➕ Adicionar", save:"💾", del:"🗑",
  del_q:"Eliminar {name}?", del_txt:"{name} será retirado da lista dos bem-comportados. Isto não pode ser anulado.", yes_del:"Sim, eliminar", new_name:"Nova criança",
  no_kids:"Ainda não há crianças na lista.", add_kid:"➕ Adicionar criança", loading:"A ir buscar as crianças ao caderno do Pai Natal…",
  load_err:"Não foi possível carregar as crianças de {store}: {err}",
  no_entity:"não existe no Home Assistant", retry:"🔄 Tentar novamente",
  stale:"🔄 Nova versão do Nordpol – a recarregar a página…",
  no_store:"Cria uma lista <b>Local To-do</b> chamada <code>Nordpol nice list</code>, ou escolhe uma lista de tarefas no editor visual do cartão.",
  elf_title:"🧝 Elfo do dia", elf_date:"{d} de dezembro",
  elf_trial:"Elfo de ensaio (o verdadeiro chega a 1 de dezembro)",
  elf_duty:"elfo de serviço hoje", elf_joke:"Piada do elfo do dia:", elf_tap:"(toca para ver a resposta)", elf_task:"Tarefa do elfo do dia:",
  elves:[["Elfo Pipo","O que é que os elfos aprendem na escola? O elfabeto!","Desenha uma estrela de Natal"],["Elfo Floco","Porque é que as renas cantam tão bem? Porque acertam sempre no toque certo!","Ajuda a pôr a mesa da Consoada"],["Elfo Cola","O que comem os bonecos de neve ao pequeno-almoço? Flocos de neve!","Arruma o teu quarto"],["Elfo Papas","Qual é a música favorita dos elfos? Embrulho-rap!","Dá um abraço a alguém de quem gostas"],["Elfo Sininho","Porque foi o Pai Natal ao médico? Os ho-ho-hos estavam roucos!","Faz um enfeite de Natal"],["Elfo Canela","Porque é que o gato gosta tanto do Natal? Porque há caixas em todo o lado!","Diz obrigado três vezes hoje"],["Elfo Centelha","Como se chama o Pai Natal quando pára? Pai Pausa!","Escreve ou desenha um postal de Natal para alguém"],["Elfo Noz-moscada","Porque foi o homem de gengibre ao médico? Sentia-se todo esmigalhado!","Ajuda a preparar alguma coisa na cozinha"],["Elfo Azevinho","Como se chama um boneco de neve em julho? Uma poça!","Bebe um copo de água a mais como um elfo saudável"],["Elfo Festão","O que dizem as renas antes de uma piada? Esta mata-te de rir – à velocidade do trenó!","Canta um vilancico em voz alta"],["Elfo Bola","Porque está tanto frio no Natal? Porque é dezem-brrr!","Faz a alguém um elogio sincero"],["Elfo Geada","Como viajam os bonecos de neve? De gelo-bicicleta!","Sai à rua a apanhar ar fresco durante 15 minutos"],["Elfo Pudim","Onde é que os bonecos de neve guardam o dinheiro? Num banco de neve!","Lê uma história durante 10 minutos"],["Elfo Gengibre","Como se chama uma rena sem olhos? Nem ideia!","Faz a cama sozinho"],["Elfo Brilho","Qual é a disciplina favorita dos elfos? Elfo-mática!","Partilha um brinquedo ou um doce com alguém"],["Elfo Rebuçado","Porque foi a árvore de Natal ao cabeleireiro? Precisava de um corte!","Diz a alguém uma coisa por que estás grato"],["Elfo Cacau","O que é vermelho e branco e vermelho e branco e vermelho e branco? O Pai Natal a rolar colina abaixo!","Põe os sapatos e o casaco no sítio, arrumados"],["Elfo Maçapão","O que disse a vela grande à vela pequenina? Esta noite vou-me apagar!","Faz um favor gentil sem que te peçam"],["Elfo Bola de Neve","O que acontece se comeres enfeites de Natal? Festão-ite!","Constrói alguma coisa com blocos, papel ou neve"],["Elfo Pimenta","Porque é que o Pai Natal gosta de bolo-rei? Porque às vezes ainda leva um prémio lá dentro!","Liga ou escreve a um avô, a uma avó ou a um amigo"],["Elfo Waffle","Qual é o melhor presente de Natal? Um tambor partido – não há quem lhe bata!","Ajuda a embrulhar um presente"],["Elfo Bordo","O que disse um boneco de neve ao outro? Também cheiras cenouras?","Desenha a tua memória de Natal preferida"],["Elfo Bolacha","Porque é que o bolo-rei foi ao ensaio? Porque já levava uma fava de prémio!","Escolhe um brinquedo para oferecer a outra pessoa"],["Elfo Goma","O que se obtém se se cruza o Pai Natal com um pato? Um Natal a grasnar!","Conta uma piada a alguém para o fazer rir"],["Elfo Sincelo","O que disse a fava do bolo-rei ao rei? Se me encontrares, ganhas o prémio!","Ajuda a montar o presépio"],["Elfo Toffee","Porque estava o ajudante do Pai Natal triste? Tinha baixa elfo-estima!","Lava os dentes extra bem – os elfos verificam!"],["Elfo Luvas","Como se chama uma rena com protetores de ouvidos? O que quiseres – ela não te ouve!","Ajuda alguém a carregar alguma coisa"],["Elfo Arando","Quantos presentes cabem no saco vazio do Pai Natal? Só um – depois já não está vazio!","Diz por favor e obrigado o dia todo"],["Elfo Hortelã","Qual das renas do Pai Natal tem piores maneiras? Malcriadolfo!","Passa uma hora sem ecrã"],["Elfo Amêndoa","O que usam os bonecos de neve na cabeça? Calotes de gelo!","Dança a tua música preferida"]],
  sl_title:"🛷 Rastreio do trenó", sl_radar:"Radar dos elfos", sl_status:"Estado da oficina", sl_demo_mode:"VOO DE TESTE (simulado)", sl_live:"EM DIRETO {date}",
  sl_rows:["🎁 Presentes embrulhados","📜 Listas de desejos lidas","🦌 Forma das renas","✨ Pó mágico no depósito","🍪 Bolachas provadas"],
  sl_after_rows:["🎁 Presentes entregues","😴 Pai Natal","🦌 Renas na estrebaria"],
  sl_after:"🎅 O Pai Natal está outra vez em casa a dormir até tarde. Obrigado por este ano! 💤",
  sl_parked:"🛷 O trenó está estacionado no Polo Norte. No dia {date} podes segui-lo aqui em direto – deve chegar a {home} por volta das {eta}.",
  sl_pre:"🛷 O trenó está a ser carregado no Polo Norte… partida às {t}", sl_done:"🏁 O Pai Natal aterrou de novo no Polo Norte. Boa noite! 💤",
  sl_land:"📍 O Pai Natal está a aterrar em <b>{a}</b>", sl_fly:"✈️ A voar de <b>{a}</b> para <b>{b}</b>", sl_here:"🎅🏠 O Pai Natal está em <b>{home}</b> neste momento! Olha pela janela ✨",
  sl_in_h:"em {h} h {m} min", sl_in_m:"em {m} min!", sl_now:"AGORA! 👀 Olha pela janela!", sl_been:"Já passou por aqui ✔",
  sl_gifts:"🎁 Presentes entregues: {n} milhões", sl_speed:"⚡ Velocidade: {s} km/s", sl_rudolf:"🦌 Rudolf: a brilhar intensamente", sl_eta:"🏠 Chegada {home}",
  sl_hint:"mantém o título premido para um voo de teste ✈️", sl_np:"Polo Norte", sl_home:"Casa",
  sl_news:["Os elfos estão a pintar os últimos cavalos de baloiço 🐴","O Rudolf está a treinar aterragens nos telhados 🏠","A Senhora Natal prova o bolo-rei 👑","Os elfos estão a montar o presépio 🏡","Os elfos estão a ordenar as listas de desejos 📜","Papel de embrulho: 4 812 km desenrolados 🎁","O Pai Natal está a experimentar o fato vermelho novo 🎅","As renas recebem aveia extra 🌾","O bacalhau da Consoada já está a demolhar 🐟","O GPS do trenó está a receber mapas novos 🗺️"],
  tab_sleigh:"Trenó", tab_nice:"Bons", tab_elf:"Elfo", locale:"pt-PT"
 },
 cs: {
  hero_title:"🎅 Severní pól", hero_sub:"Tajná řídicí místnost Ježíška", until:"⏳ Štědrý den za",
  u_d:"dny", u_h:"hod", u_m:"min", u_s:"s",
  n_many:"zbývá {n} nocí", n_one:"Zbývá jen 1 noc! 😴", n_zero:"Ježíšek přijde dnes večer! 🎅", n_title:"{n} nocí",
  party:"🎉 Veselé Vánoce! 🎉", party_sub:"Ježíšek tu už byl – koukněte pod stromeček! 🎁",
  cam_title:"📹 Kamery Severního pólu", cam_live:"● ŽIVĚ", cam_tap:"klepněte pro celou obrazovku", cam_lost:"⚠ ZTRÁTA SIGNÁLU", cam_restore:"znovu se připojuje…",
  cam_lost_label:"CAM 01 – JEŽÍŠKOVA KANCELÁŘ", cam_foot:"🔒 Tajná elfí kamera · jen pro hodné děti", cam_close:"klepněte pro zavření ✕",
  periods:{morning:"🌅 ráno",day:"☀️ den",evening:"🌙 večer",morgen:"🌅 ráno",dag:"☀️ den",aften:"🌙 večer"},
  nice_title:"⭐ Seznam hodných", nice_sub:"Ježíškův zápisník", parent:"🔓 Režim rodičů (zavře se po 2 min)",
  why:"Co se stalo? (např. pomohl prostřít stůl)", log_title:"📜 Elfí deník", no_log:"Zatím žádné poznámky…", hold:"🔒 podržte titulek 1 s.",
  lv:["Ouha… uhlí v punčoše? 🪨","Elfové se dívají 👀","Skoro hodný 🙂","Hodný ⭐","SUPER hodný 🌟"],
  reset:"🔄 Resetovat seznam hodných", reset_q:"Resetovat seznam hodných?",
  reset_txt:"Každé dítě se vrátí na svou startovní bodovou hodnotu a elfí deník začne znovu.",
  yes_reset:"Ano, resetovat", cancel:"Zrušit", new_start:"Nový začátek – elfové se dívají! 👀",
  edit:"✏️ Upravit děti", edit_done:"✔ Hotovo", e_emoji:"Emoji", e_name:"Jméno", e_start:"Start", add:"➕ Přidat", save:"💾", del:"🗑",
  del_q:"Smazat {name}?", del_txt:"{name} bude odebráno ze seznamu hodných. Tuto akci nelze vrátit zpět.", yes_del:"Ano, smazat", new_name:"Nové dítě",
  no_kids:"Na seznamu zatím nejsou žádné děti.", add_kid:"➕ Přidat dítě", loading:"Načítám děti z Ježíškova zápisníku…",
  load_err:"Nepodařilo se načíst děti z {store}: {err}",
  no_entity:"v Home Assistant neexistuje", retry:"🔄 Zkusit znovu",
  stale:"🔄 Nová verze Nordpol – stránka se znovu načítá…",
  no_store:"Vytvořte seznam <b>Local To-do</b> s názvem <code>Nordpol nice list</code>, nebo vyberte seznam úkolů ve vizuálním editoru karty.",
  elf_title:"🧝 Elf dne", elf_date:"{d}. prosince",
  elf_trial:"Zkušební elf (ten pravý přijde 1. prosince)",
  elf_duty:"elf dnes ve službě", elf_joke:"Vtip elfa dne:", elf_tap:"(klepněte pro odpověď)", elf_task:"Úkol elfa dne:",
  elves:[["Elf Pípa","Co se elfové učí ve škole? Obalovat dárky na jedničku!","Nakresli vánoční hvězdu"],["Elf Vločka","Proč sobi tak hezky zpívají? Protože mají cit pro parohmonii!","Pomoz prostřít na Štědrý večer"],["Elf Lepík","Co jedí sněhuláci k snídani? Sněhové vločky!","Uklid si pokojíček"],["Elf Kaše","Jakou mají elfové oblíbenou hudbu? Balicí rap!","Pořádně obejmi někoho, koho máš rád"],["Elf Rolnička","Proč šel kapr k doktorovi? Měl trochu šupinatou náladu!","Vyrob vánoční ozdobu"],["Elf Skořice","Proč má kočka ráda Vánoce? Protože je všude plno krabic!","Řekni dnes třikrát děkuji"],["Elf Jiskra","Kdy má Ježíšek přestávku? Až jsou všechny dárky pod stromečkem!","Napiš nebo nakresli někomu vánoční přání"],["Elf Muškát","Proč šel perníček k doktorovi? Byl celý drobivý!","Pomoz upéct vánoční cukroví"],["Elf Cesmína","Jak se jmenuje sněhulák v červenci? Louže!","Vypij sklenici vody navíc jako hodný elf"],["Elf Girlanda","Co říkají sobi před vtipem? Ten vtip tě složí – i se saněmi!","Zazpívej koledu nahlas"],["Elf Baňka","Proč je o Vánocích taková zima? Protože je prosinec, brrr!","Řekni někomu upřímný kompliment"],["Elf Mráz","Jak cestují sněhuláci? Na ledovém kole!","Jdi na 15 minut na čerstvý vzduch"],["Elf Pudink","Kde mají sněhuláci peníze? Ve sněhové bance!","Čti pohádku 10 minut"],["Elf Zázvor","Jak se jmenuje sob bez očí? Nemám tušení!","Ustel si postel úplně sám"],["Elf Třpyt","Jaký je elfí nejoblíbenější předmět? Elfematika!","Sdílej hračku nebo pamlsek s někým"],["Elf Bonbon","Proč šel vánoční stromeček k holiči? Potřeboval zastřihnout!","Řekni někomu jednu věc, za kterou jsi vděčný"],["Elf Kakao","Co je šupinaté a před Vánoci bydlí ve vaně? Kapr!","Uklid si boty a bundu na místo"],["Elf Marcipán","Co řekla velká svíčka malé? Dnes večer zhasnu!","Udělej laskavost, aniž by tě o ni žádali"],["Elf Sněhová koule","Co dostaneš, když sníš ozdoby? Girlanditidu!","Postav něco z kostek, papíru nebo sněhu"],["Elf Pepř","Proč má Ježíšek plné ruce práce? Protože cukroví se musí nejdřív ochutnat!","Zavolej nebo napiš prarodičům nebo kamarádovi"],["Elf Vafa","Jaký je nejlepší vánoční dárek? Rozbitý buben – ten neporazíš, a stejně na něj neuhodíš!","Pomoz zabalit dárek"],["Elf Javor","Co řekl jeden sněhulák druhému? Taky cítíš mrkev?","Nakresli svou nejmilejší vánoční vzpomínku"],["Elf Sušenka","Proč byl krocan v kapele? Protože měl paličky!","Vyber jednu hračku, kterou můžeš někomu dát"],["Elf Želatina","Co vznikne křížením Ježíška a kachny? Vánoční kačer!","Řekni někomu vtip, aby se zasmál"],["Elf Rampouch","Proč bydlí kapr před Vánoci ve vaně? Protože v řece vanu neměl!","S dospělým zkuste lití olova"],["Elf Karamel","Proč byl Ježíškův pomocník smutný? Měl nízké elfovědomí!","Vyčisti si zuby extra pečlivě – elfové to kontrolují!"],["Elf Rukavice","Jak se jmenuje sob s klapkami na uši? Jak chceš – stejně tě neslyší!","Pomoz někomu něco donést"],["Elf Brusinka","Kolik dárků se vejde Ježíškovi do prázdného pytle? Jen jeden – potom už není prázdný!","Říkej prosím a děkuji celý den"],["Elf Máta","Který Ježíškův sob má nejhorší vychování? Drzoudolf!","Stráv hodinu bez obrazovky"],["Elf Mandlík","Co nosí sněhuláci na hlavě? Ledové čepice!","Zatanči si na svou oblíbenou písničku"]],
  sl_title:"🛷 Sledování saní", sl_radar:"Elfí radar", sl_status:"Stav dílny", sl_demo_mode:"ZKUŠEBNÍ LET (simulace)", sl_live:"ŽIVĚ {date}",
  sl_rows:["🎁 Dárky zabalené","📜 Seznamy přání přečtené","🦌 Kondice sobů","✨ Kouzelný prach v nádrži","🍪 Cukroví ochutnané"],
  sl_after_rows:["🎁 Dárky doručené","😴 Ježíšek","🦌 Sobi ve stáji"],
  sl_after:"🎅 Ježíšek už zase spí doma do pozdna. Díky za tenhle rok! 💤",
  sl_parked:"🛷 Saně parkují na Severním pólu. {date} je tu můžete sledovat živě – k {home} by měly dorazit kolem {eta}.",
  sl_pre:"🛷 Saně se nakládají na Severním pólu… odlet v {t}", sl_done:"🏁 Ježíšek znovu přistál na Severním pólu. Dobrou noc! 💤",
  sl_land:"📍 Ježíšek přistává v <b>{a}</b>", sl_fly:"✈️ Letí z <b>{a}</b> do <b>{b}</b>", sl_here:"🎅🏠 Ježíšek je právě v <b>{home}</b>! Koukněte z okna ✨",
  sl_in_h:"za {h} h {m} min", sl_in_m:"za {m} min!", sl_now:"TEĎ! 👀 Koukněte z okna!", sl_been:"Už tu byl ✔",
  sl_gifts:"🎁 Doručené dárky: {n} milionů", sl_speed:"⚡ Rychlost: {s} km/s", sl_rudolf:"🦌 Rudolf: jasně září", sl_eta:"🏠 Příjezd {home}",
  sl_hint:"podržte titulek pro zkušební let ✈️", sl_np:"Severní pól", sl_home:"Domov",
  sl_news:["Elfové natírají poslední houpací koníky 🐴","Rudolf cvičí přistání na střechy 🏠","Peče se poslední várka vánočního cukroví 🍪","Kapr už plave ve vaně 🐟","Elfové třídí seznamy přání 📜","Balicí papír: 4 812 km rozvinuto 🎁","Ježíšek chystá dárky pod stromeček 🎁","Sobi dostávají extra oves 🌾","Formičky na lití olova jsou nachystané ✨","GPS saní stahuje nové mapy 🗺️"],
  tab_sleigh:"Saně", tab_nice:"Hodní", tab_elf:"Elf", locale:"cs-CZ"
 }
};
function langOf(c){ const l=String((c&&c.language)||document.documentElement.lang||navigator.language||"en").toLowerCase(); if(l.startsWith("nb")||l.startsWith("no")||l.startsWith("nn")) return "nb"; for(const k of ["da","fr","de","es","sv","nl","fi","pl","it","pt","cs"]) if(l.startsWith(k)) return k; return "en"; }
function escVal(v){
  if(Array.isArray(v)) return v.map(escVal);
  if(v && typeof v==="object"){ const o={}; for(const k of Object.keys(v)) o[k]=escVal(v[k]); return o; }
  return esc(v);
}
function TRaw(c){
  const L=I18N[langOf(c)];
  if(!c||!c.strings||typeof c.strings!=="object") return L;
  const o=Object.assign({},L);
  for(const k of Object.keys(c.strings)) if(k!=="__proto__"&&k!=="constructor"&&k!=="prototype") o[k]=c.strings[k];
  return o;
}
function T(c){
  const L=I18N[langOf(c)];
  if(!c||!c.strings||typeof c.strings!=="object") return L;
  const o=Object.assign({},L);
  for(const k of Object.keys(c.strings)) if(k!=="__proto__"&&k!=="constructor"&&k!=="prototype") o[k]=escVal(c.strings[k]);
  return o;
}
function hasDefaultTodo(hass, entities){
  const id="todo.nordpol_nice_list";
  return (Array.isArray(entities)&&entities.includes(id)) || Boolean(hass&&hass.states&&hass.states[id]);
}
function assertObj(c){ if(!c || typeof c!=="object" || Array.isArray(c)) throw new Error("Invalid card configuration"); }
const LANG_OPTS = [{value:"",label:"Auto"},{value:"en",label:"English"},{value:"da",label:"Dansk"},{value:"fr",label:"Français"},{value:"de",label:"Deutsch"},{value:"es",label:"Español"},{value:"sv",label:"Svenska"},{value:"nb",label:"Norsk bokmål"},{value:"nl",label:"Nederlands"},{value:"fi",label:"Suomi"},{value:"pl",label:"Polski"},{value:"it",label:"Italiano"},{value:"pt",label:"Português"},{value:"cs",label:"Čeština"}];
const OV_OPTS_L = {
 en:[{value:"minimal",label:"Minimal (REC + clock + label)"},{value:"cctv",label:"CCTV (scanlines + vignette)"},{value:"off",label:"Off (video only)"}],
 da:[{value:"minimal",label:"Minimal (REC + ur + navn)"},{value:"cctv",label:"CCTV (scanlinjer + vignet)"},{value:"off",label:"Fra (kun video)"}],
 fr:[{value:"minimal",label:"Minimal (REC + horloge + nom)"},{value:"cctv",label:"CCTV (lignes + vignette)"},{value:"off",label:"Désactivé (vidéo seule)"}],
 de:[{value:"minimal",label:"Minimal (REC + Uhr + Name)"},{value:"cctv",label:"CCTV (Scanlines + Vignette)"},{value:"off",label:"Aus (nur Video)"}],
 es:[{value:"minimal",label:"Mínimo (REC + reloj + nombre)"},{value:"cctv",label:"CCTV (líneas + viñeta)"},{value:"off",label:"Apagado (solo vídeo)"}],
 sv:[{value:"minimal",label:"Minimal (REC + klocka + namn)"},{value:"cctv",label:"CCTV (scanlinjer + vinjett)"},{value:"off",label:"Av (endast video)"}],
 nb:[{value:"minimal",label:"Minimal (REC + klokke + navn)"},{value:"cctv",label:"CCTV (skannlinjer + vignett)"},{value:"off",label:"Av (bare video)"}],
 nl:[{value:"minimal",label:"Minimaal (REC + klok + naam)"},{value:"cctv",label:"CCTV (scanlijnen + vignet)"},{value:"off",label:"Uit (alleen video)"}],
 fi:[{value:"minimal",label:"Minimaalinen (REC + kello + nimi)"},{value:"cctv",label:"CCTV (juovat + vinjetti)"},{value:"off",label:"Pois (vain video)"}],
 pl:[{value:"minimal",label:"Minimalny (REC + zegar + nazwa)"},{value:"cctv",label:"CCTV (linie + winieta)"},{value:"off",label:"Wyłączony (tylko wideo)"}],
 it:[{value:"minimal",label:"Minimale (REC + orologio + nome)"},{value:"cctv",label:"CCTV (linee + vignettatura)"},{value:"off",label:"Disattivo (solo video)"}],
 pt:[{value:"minimal",label:"Mínimo (REC + relógio + nome)"},{value:"cctv",label:"CCTV (linhas + vinheta)"},{value:"off",label:"Desligado (só vídeo)"}],
 cs:[{value:"minimal",label:"Minimální (REC + hodiny + název)"},{value:"cctv",label:"CCTV (linky + viněta)"},{value:"off",label:"Vypnuto (jen video)"}]
};
const CCTV_OPTS_L = {
 en:[{value:"color",label:"Color"},{value:"mono",label:"Monochrome"}],
 da:[{value:"color",label:"Farve"},{value:"mono",label:"Sort-hvid"}],
 fr:[{value:"color",label:"Couleur"},{value:"mono",label:"Monochrome"}],
 de:[{value:"color",label:"Farbe"},{value:"mono",label:"Schwarzweiß"}],
 es:[{value:"color",label:"Color"},{value:"mono",label:"Monocromo"}],
 sv:[{value:"color",label:"Färg"},{value:"mono",label:"Svartvit"}],
 nb:[{value:"color",label:"Farge"},{value:"mono",label:"Svart-hvitt"}],
 nl:[{value:"color",label:"Kleur"},{value:"mono",label:"Zwart-wit"}],
 fi:[{value:"color",label:"Väri"},{value:"mono",label:"Mustavalkoinen"}],
 pl:[{value:"color",label:"Kolor"},{value:"mono",label:"Czarno-biały"}],
 it:[{value:"color",label:"Colore"},{value:"mono",label:"Monocromatico"}],
 pt:[{value:"color",label:"Cor"},{value:"mono",label:"Monocromático"}],
 cs:[{value:"color",label:"Barva"},{value:"mono",label:"Černobílá"}]
};
const ovOpts = c => OV_OPTS_L[langOf(c)] || OV_OPTS_L.en;
const cctvOpts = c => CCTV_OPTS_L[langOf(c)] || CCTV_OPTS_L.en;
const OV_OPTS = OV_OPTS_L.en;
const CCTV_OPTS = CCTV_OPTS_L.en;
const ED_T = {
 en: {lang:"Language",tab:"Default tab",date:"Celebration date (MM-DD)",target:"Countdown target (MM-DD HH:MM)",until:"Countdown heading",eta:"Sleigh ETA (HH:MM)",store:"Nice list (Local To-do entity)",sel:"Select to-do list",log:"Elf log entity (optional)",dstart:"Default starting score",llines:"Visible log lines",ov:"Camera overlay",cctv:"CCTV filter style",df:"Camera clock format",foot:"Camera footer text",gl:"Camera signal glitch effect",hb:"Home button path (optional)",snow:"Falling snow in hero",tz:"Time zone (optional)",title:"Card title",sub:"Subtitle",elf_ent:"Custom elf entity (optional)",tip:"Tip: Advanced options (custom cams, strings, extra sleigh stops) are preserved in YAML."},
 da: {lang:"Sprog",tab:"Startfane",date:"Festdato (MM-DD)",target:"Nedtællingsmål (MM-DD TT:MM)",until:"Nedtællingstekst",eta:"Kane-ankomst (TT:MM)",store:"Artig-liste (Local To-do entitet)",sel:"Vælg to-do liste",log:"Nisse-log entitet (valgfri)",dstart:"Startpoint som standard",llines:"Synlige loglinjer",ov:"Kamera-overlay",cctv:"CCTV-filterstil",df:"Kamera-ur format",foot:"Kamera-bundtekst",gl:"Kamera signal-glitch effekt",hb:"Hjem-knap sti (valgfri)",snow:"Snevejr i toppen",tz:"Tidszone (valgfri)",title:"Korttitel",sub:"Undertitel",elf_ent:"Brugerdefineret nisse-entitet (valgfri)",tip:"Tip: Avancerede felter (kameraer, tekster, ekstra stop) bevares i YAML."},
 fr: {lang:"Langue",tab:"Onglet par défaut",date:"Date de fête (MM-JJ)",target:"Cible du compte à rebours (MM-JJ HH:MM)",until:"Titre du compte à rebours",eta:"Arrivée du traîneau (HH:MM)",store:"Liste des enfants sages (entité To-do)",sel:"Choisir une liste",log:"Entité journal des lutins (optionnel)",dstart:"Score de départ par défaut",llines:"Lignes de journal visibles",ov:"Superposition caméra",cctv:"Style de filtre CCTV",df:"Format de l’horloge caméra",foot:"Texte pied de carte caméra",gl:"Effet de brouillage caméra",hb:"Chemin bouton Accueil (optionnel)",snow:"Neige qui tombe dans l’en-tête",tz:"Fuseau horaire (optionnel)",title:"Titre de la carte",sub:"Sous-titre",elf_ent:"Entité lutin personnalisée (optionnel)",tip:"Astuce : Les options avancées (caméras, textes, arrêts) sont conservées en YAML."},
 de: {lang:"Sprache",tab:"Start-Tab",date:"Festtag (MM-TT)",target:"Countdown-Ziel (MM-TT HH:MM)",until:"Countdown-Überschrift",eta:"Schlitten-Ankunft (HH:MM)",store:"Artig-Liste (Local-To-do-Entität)",sel:"To-do-Liste wählen",log:"Wichtel-Log-Entität (optional)",dstart:"Standard-Startpunktzahl",llines:"Sichtbare Log-Zeilen",ov:"Kamera-Overlay",cctv:"CCTV-Filterstil",df:"Kamera-Uhrformat",foot:"Kamera-Fußzeile",gl:"Kamera-Signalstörung (Glitch)",hb:"Home-Button-Pfad (optional)",snow:"Schneefall im Kopfbereich",tz:"Zeitzone (optional)",title:"Kartentitel",sub:"Untertitel",elf_ent:"Benutzerdefinierte Wichtel-Entität (optional)",tip:"Tipp: Erweiterte Optionen (Kameras, Texte, Extra-Stopps) bleiben in YAML erhalten."},
 es: {lang:"Idioma",tab:"Pestaña inicial",date:"Fecha de celebración (MM-DD)",target:"Objetivo cuenta atrás (MM-DD HH:MM)",until:"Título cuenta atrás",eta:"Llegada del trineo (HH:MM)",store:"Lista de niños buenos (entidad To-do)",sel:"Seleccionar lista",log:"Entidad de registro élfico (opcional)",dstart:"Puntuación inicial por defecto",llines:"Líneas de registro visibles",ov:"Superposición de cámara",cctv:"Estilo de filtro CCTV",df:"Formato del reloj de cámara",foot:"Texto de pie de cámara",gl:"Efecto de interferencia en cámara",hb:"Ruta botón Inicio (opcional)",snow:"Nieve cayendo en la cabecera",tz:"Zona horaria (opcional)",title:"Título de la tarjeta",sub:"Subtítulo",elf_ent:"Entidad de elfo personalizada (opcional)",tip:"Consejo: Las opciones avanzadas (cámaras, textos, paradas) se conservan en YAML."},
 sv: {lang:"Språk",tab:"Startflik",date:"Festdatum (MM-DD)",target:"Nedräkningsmål (MM-DD TT:MM)",until:"Nedräkningsrubrik",eta:"Slädens ankomst (TT:MM)",store:"Snällista (Local To-do-entitet)",sel:"Välj att göra-lista",log:"Nisselogg-entitet (valfri)",dstart:"Startpoäng som standard",llines:"Synliga loggrader",ov:"Kameraöverlägg",cctv:"CCTV-filterstil",df:"Format för kameraklocka",foot:"Kamerans sidfot",gl:"Signalstörningseffekt för kamera",hb:"Sökväg för hemknapp (valfri)",snow:"Snöfall i toppen",tz:"Tidszon (valfri)",title:"Korttitel",sub:"Underrubrik",elf_ent:"Egen nisse-entitet (valfri)",tip:"Tips: Avancerade inställningar (kameror, texter, extra stopp) bevaras i YAML."},
 nb: {lang:"Språk",tab:"Startfane",date:"Festdato (MM-DD)",target:"Nedtellingsmål (MM-DD TT:MM)",until:"Nedtellingsoverskrift",eta:"Sledeankomst (TT:MM)",store:"Snilleliste (Local To-do-entitet)",sel:"Velg gjøremålsliste",log:"Nisselogg-entitet (valgfri)",dstart:"Standard startpoeng",llines:"Synlige logglinjer",ov:"Kameraoverlegg",cctv:"CCTV-filterstil",df:"Format for kameraklokke",foot:"Kameratekst nederst",gl:"Glitch-effekt for kamerasignalet",hb:"Sti for hjem-knapp (valgfri)",snow:"Snøfall i toppen",tz:"Tidssone (valgfri)",title:"Korttittel",sub:"Undertittel",elf_ent:"Egendefinert nisse-entitet (valgfri)",tip:"Tips: Avanserte innstillinger (kameraer, tekster, ekstra stopp) beholdes i YAML."},
 nl: {lang:"Taal",tab:"Standaardtabblad",date:"Feestdatum (MM-DD)",target:"Afteldoel (MM-DD UU:MM)",until:"Afteltitel",eta:"Aankomst arrenslee (UU:MM)",store:"Lieve lijst (Local To-do-entiteit)",sel:"Kies takenlijst",log:"Elfenlogboek-entiteit (optioneel)",dstart:"Standaard startscore",llines:"Zichtbare logregels",ov:"Camera-overlay",cctv:"CCTV-filterstijl",df:"Formaat cameraklok",foot:"Cameratekst onderaan",gl:"Camerasignaal-glitcheffect",hb:"Pad van de startknop (optioneel)",snow:"Vallende sneeuw bovenaan",tz:"Tijdzone (optioneel)",title:"Kaarttitel",sub:"Ondertitel",elf_ent:"Aangepaste elf-entiteit (optioneel)",tip:"Tip: geavanceerde opties (camera's, teksten, extra stops) blijven bewaard in YAML."},
 fi: {lang:"Kieli",tab:"Oletusvälilehti",date:"Juhlapäivä (KK-PP)",target:"Laskurin kohde (KK-PP TT:MM)",until:"Laskurin otsikko",eta:"Reen saapuminen (TT:MM)",store:"Kilttilista (Local To-do -entiteetti)",sel:"Valitse tehtävälista",log:"Tonttuloki-entiteetti (valinnainen)",dstart:"Oletusaloituspisteet",llines:"Näkyvät lokirivit",ov:"Kameran peittokuva",cctv:"CCTV-suodattimen tyyli",df:"Kamerakellon muoto",foot:"Kameran alatunniste",gl:"Kamerasignaalin häiriötehoste",hb:"Koti-painikkeen polku (valinnainen)",snow:"Putoavaa lunta yläosassa",tz:"Aikavyöhyke (valinnainen)",title:"Kortin otsikko",sub:"Alaotsikko",elf_ent:"Oma tonttu-entiteetti (valinnainen)",tip:"Vinkki: lisäasetukset (kamerat, tekstit, lisäpysähdykset) säilyvät YAML:ssä."},
 pl: {lang:"Język",tab:"Domyślna karta",date:"Data święta (MM-DD)",target:"Cel odliczania (MM-DD GG:MM)",until:"Nagłówek odliczania",eta:"Przyjazd sań (GG:MM)",store:"Lista grzecznych (encja Local To-do)",sel:"Wybierz listę zadań",log:"Encja dziennika elfów (opcjonalnie)",dstart:"Domyślna punktacja początkowa",llines:"Widoczne wiersze dziennika",ov:"Nakładka kamery",cctv:"Styl filtra CCTV",df:"Format zegara kamery",foot:"Stopka kamery",gl:"Efekt zakłócenia sygnału kamery",hb:"Ścieżka przycisku Strona główna (opcjonalnie)",snow:"Padający śnieg u góry",tz:"Strefa czasowa (opcjonalnie)",title:"Tytuł karty",sub:"Podtytuł",elf_ent:"Własna encja elfa (opcjonalnie)",tip:"Wskazówka: opcje zaawansowane (kamery, teksty, dodatkowe przystanki) zostają w YAML."},
 it: {lang:"Lingua",tab:"Scheda predefinita",date:"Data della festa (MM-GG)",target:"Obiettivo conto alla rovescia (MM-GG HH:MM)",until:"Titolo del conto alla rovescia",eta:"Arrivo della slitta (HH:MM)",store:"Lista dei buoni (entità Local To-do)",sel:"Seleziona elenco attività",log:"Entità diario degli elfi (facoltativa)",dstart:"Punteggio iniziale predefinito",llines:"Righe visibili del diario",ov:"Sovrapposizione telecamera",cctv:"Stile filtro CCTV",df:"Formato orologio telecamera",foot:"Piè di pagina della telecamera",gl:"Effetto disturbo del segnale",hb:"Percorso del pulsante Home (facoltativo)",snow:"Neve che cade in alto",tz:"Fuso orario (facoltativo)",title:"Titolo della scheda",sub:"Sottotitolo",elf_ent:"Entità elfo personalizzata (facoltativa)",tip:"Suggerimento: le opzioni avanzate (telecamere, testi, tappe extra) restano nel YAML."},
 pt: {lang:"Idioma",tab:"Separador predefinido",date:"Data da festa (MM-DD)",target:"Alvo da contagem (MM-DD HH:MM)",until:"Título da contagem",eta:"Chegada do trenó (HH:MM)",store:"Lista dos bem-comportados (entidade Local To-do)",sel:"Escolher lista de tarefas",log:"Entidade do diário dos elfos (opcional)",dstart:"Pontuação inicial predefinida",llines:"Linhas visíveis do diário",ov:"Sobreposição da câmara",cctv:"Estilo do filtro CCTV",df:"Formato do relógio da câmara",foot:"Rodapé da câmara",gl:"Efeito de interferência do sinal",hb:"Caminho do botão Início (opcional)",snow:"Neve a cair no topo",tz:"Fuso horário (opcional)",title:"Título do cartão",sub:"Subtítulo",elf_ent:"Entidade de elfo personalizada (opcional)",tip:"Dica: as opções avançadas (câmaras, textos, paragens extra) mantêm-se no YAML."},
 cs: {lang:"Jazyk",tab:"Výchozí karta",date:"Datum svátku (MM-DD)",target:"Cíl odpočtu (MM-DD HH:MM)",until:"Nadpis odpočtu",eta:"Příjezd saní (HH:MM)",store:"Seznam hodných (entita Local To-do)",sel:"Vybrat seznam úkolů",log:"Entita elfího deníku (volitelné)",dstart:"Výchozí startovní skóre",llines:"Viditelné řádky deníku",ov:"Překryv kamery",cctv:"Styl filtru CCTV",df:"Formát hodin kamery",foot:"Zápatí kamery",gl:"Efekt rušení kamerového signálu",hb:"Cesta tlačítka Domů (volitelné)",snow:"Padající sníh nahoře",tz:"Časové pásmo (volitelné)",title:"Název karty",sub:"Podtitul",elf_ent:"Vlastní entita elfa (volitelné)",tip:"Tip: pokročilé volby (kamery, texty, další zastávky) zůstanou v YAML."}
};
const ED_H = {
 en: {date:"Default 12-24 (or e.g. 12-25, 01-07).",target:"MM-DD HH:MM or HH:MM (uses celebration date). Default 12-24 18:00 (fr/es/nl/it/pt 12-25 00:00).",eta:"Local 24-hour arrival time (default 23:59).",tz:"IANA zone, e.g. Europe/Copenhagen (defaults to Home Assistant time zone).",df:"Tokens: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace path, e.g. /lovelace/0 (adds a Home tab button).",store:"Stores children & scores; defaults to todo.nordpol_nice_list if present.",log:"Optional input_text entity; otherwise logs are saved inside the To-do list.",elf_ent:"State formatted as Name|Joke? Answer|Task."},
 da: {date:"Standard 12-24 (eller f.eks. 12-25, 01-07).",target:"MM-DD TT:MM eller TT:MM (bruger festdato). Standard 12-24 18:00.",eta:"Lokal ankomsttid i 24-timers format (standard 23:59).",tz:"IANA-tidszone, f.eks. Europe/Copenhagen (bruger ellers HA’s tidszone).",df:"Koder: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-sti, f.eks. /lovelace/0 (tilføjer en Hjem-fane).",store:"Gemmer børn og point; bruger todo.nordpol_nice_list hvis den findes.",log:"Valgfri input_text-entitet; ellers gemmes loggen i To-do listen.",elf_ent:"Tilstand i formatet Navn|Vittighed? Svar|Opgave."},
 fr: {date:"Par défaut 12-24 (ou p. ex. 12-25, 01-07).",target:"MM-JJ HH:MM ou HH:MM (utilise la date de fête). Par défaut 12-25 00:00.",eta:"Heure locale d’arrivée sur 24 h (par défaut 23:59).",tz:"Fuseau IANA, p. ex. Europe/Paris (sinon celui de Home Assistant).",df:"Jetons : YYYY, MM, DD, HH, mm, ss.",hb:"Chemin Lovelace, p. ex. /lovelace/0 (ajoute un bouton Accueil).",store:"Stocke enfants et scores ; utilise todo.nordpol_nice_list si présente.",log:"Entité input_text optionnelle ; sinon le journal reste dans la liste To-do.",elf_ent:"État au format Nom|Blague ? Réponse|Mission."},
 de: {date:"Standard 12-24 (oder z. B. 12-25, 01-07).",target:"MM-TT HH:MM oder HH:MM (nutzt Festtag). Standard 12-24 18:00.",eta:"Lokale Ankunftszeit im 24h-Format (Standard 23:59).",tz:"IANA-Zeitzone, z. B. Europe/Berlin (sonst HA-Zeitzone).",df:"Platzhalter: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-Pfad, z. B. /lovelace/0 (fügt einen Home-Button hinzu).",store:"Speichert Kinder & Punkte; nutzt todo.nordpol_nice_list falls vorhanden.",log:"Optionale input_text-Entität; sonst wird das Log in der To-do-Liste gespeichert.",elf_ent:"Zustand im Format Name|Witz? Antwort|Aufgabe."},
 es: {date:"Por defecto 12-24 (o p. ej. 12-25, 01-07).",target:"MM-DD HH:MM o HH:MM (usa la fecha de celebración). Por defecto 12-25 00:00.",eta:"Hora local de llegada en formato 24 h (por defecto 23:59).",tz:"Zona IANA, p. ej. Europe/Madrid (si no, la de Home Assistant).",df:"Códigos: YYYY, MM, DD, HH, mm, ss.",hb:"Ruta de Lovelace, p. ej. /lovelace/0 (añade un botón de Inicio).",store:"Guarda niños y puntos; usa todo.nordpol_nice_list si existe.",log:"Entidad input_text opcional; si no, el registro se guarda en la lista To-do.",elf_ent:"Estado con formato Nombre|Chiste? Respuesta|Misión."},
 sv: {date:"Standard 12-24 (eller t.ex. 12-25, 01-07).",target:"MM-DD TT:MM eller TT:MM (använder festdatum). Standard 12-24 18:00.",eta:"Lokal ankomsttid i 24-timmarsformat (standard 23:59).",tz:"IANA-tidszon, t.ex. Europe/Stockholm (annars används HA:s tidszon).",df:"Koder: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-sökväg, t.ex. /lovelace/0 (lägger till en Hem-flik).",store:"Sparar barn och poäng; använder todo.nordpol_nice_list om den finns.",log:"Valfri input_text-entitet; annars sparas loggen i att göra-listan.",elf_ent:"Tillstånd i formatet Namn|Vits? Svar|Uppdrag."},
 nb: {date:"Standard 12-24 (eller f.eks. 12-25, 01-07).",target:"MM-DD TT:MM eller TT:MM (bruker festdato). Standard 12-24 18:00.",eta:"Lokal ankomsttid i 24-timersformat (standard 23:59).",tz:"IANA-tidssone, f.eks. Europe/Oslo (ellers brukes HA-tidssonen).",df:"Koder: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-sti, f.eks. /lovelace/0 (legger til en Hjem-fane).",store:"Lagrer barn og poeng; bruker todo.nordpol_nice_list hvis den finnes.",log:"Valgfri input_text-entitet; ellers lagres loggen i gjøremålslisten.",elf_ent:"Tilstand i formatet Navn|Vits? Svar|Oppdrag."},
 nl: {date:"Standaard 12-24 (of bijv. 12-25, 01-07).",target:"MM-DD UU:MM of UU:MM (gebruikt de feestdatum). Standaard 12-25 00:00.",eta:"Lokale aankomsttijd in 24-uursnotatie (standaard 23:59).",tz:"IANA-tijdzone, bijv. Europe/Amsterdam (anders de tijdzone van HA).",df:"Codes: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-pad, bijv. /lovelace/0 (voegt een Start-tabblad toe).",store:"Slaat kinderen en scores op; gebruikt todo.nordpol_nice_list als die er is.",log:"Optionele input_text-entiteit; anders wordt het logboek in de takenlijst bewaard.",elf_ent:"Status in het formaat Naam|Grap? Antwoord|Opdracht."},
 fi: {date:"Oletus 12-24 (tai esim. 12-25, 01-07).",target:"KK-PP TT:MM tai TT:MM (käyttää juhlapäivää). Oletus 12-24 18:00.",eta:"Paikallinen saapumisaika 24 tunnin muodossa (oletus 23:59).",tz:"IANA-aikavyöhyke, esim. Europe/Helsinki (muuten käytetään HA:n aikavyöhykettä).",df:"Koodit: YYYY, MM, DD, HH, mm, ss.",hb:"Lovelace-polku, esim. /lovelace/0 (lisää Koti-välilehden).",store:"Tallentaa lapset ja pisteet; käyttää todo.nordpol_nice_list-listaa, jos se on olemassa.",log:"Valinnainen input_text-entiteetti; muuten loki tallennetaan tehtävälistaan.",elf_ent:"Tila muodossa Nimi|Vitsi? Vastaus|Tehtävä."},
 pl: {date:"Domyślnie 12-24 (lub np. 12-25, 01-07).",target:"MM-DD GG:MM lub GG:MM (używa daty święta). Domyślnie 12-24 18:00.",eta:"Lokalna godzina przylotu w formacie 24-godzinnym (domyślnie 23:59).",tz:"Strefa IANA, np. Europe/Warsaw (w przeciwnym razie strefa HA).",df:"Kody: YYYY, MM, DD, HH, mm, ss.",hb:"Ścieżka Lovelace, np. /lovelace/0 (dodaje kartę Strona główna).",store:"Przechowuje dzieci i punkty; używa todo.nordpol_nice_list, jeśli istnieje.",log:"Opcjonalna encja input_text; w przeciwnym razie dziennik jest w liście zadań.",elf_ent:"Stan w formacie Imię|Żart? Odpowiedź|Zadanie."},
 it: {date:"Predefinito 12-24 (o ad es. 12-25, 01-07).",target:"MM-GG HH:MM o HH:MM (usa la data della festa). Predefinito 12-25 00:00.",eta:"Orario locale di arrivo in formato 24 ore (predefinito 23:59).",tz:"Fuso IANA, ad es. Europe/Rome (altrimenti quello di Home Assistant).",df:"Codici: YYYY, MM, DD, HH, mm, ss.",hb:"Percorso Lovelace, ad es. /lovelace/0 (aggiunge una scheda Home).",store:"Salva bambini e punteggi; usa todo.nordpol_nice_list se presente.",log:"Entità input_text facoltativa; altrimenti il diario resta nell'elenco attività.",elf_ent:"Stato nel formato Nome|Barzelletta? Risposta|Compito."},
 pt: {date:"Predefinido 12-24 (ou p. ex. 12-25, 01-07).",target:"MM-DD HH:MM ou HH:MM (usa a data da festa). Predefinido 12-25 00:00.",eta:"Hora local de chegada no formato de 24 horas (predefinido 23:59).",tz:"Fuso IANA, p. ex. Europe/Lisbon (caso contrário, o do Home Assistant).",df:"Códigos: YYYY, MM, DD, HH, mm, ss.",hb:"Caminho Lovelace, p. ex. /lovelace/0 (adiciona um separador Início).",store:"Guarda crianças e pontuações; usa todo.nordpol_nice_list se existir.",log:"Entidade input_text opcional; caso contrário, o diário fica na lista de tarefas.",elf_ent:"Estado no formato Nome|Piada? Resposta|Tarefa."},
 cs: {date:"Výchozí 12-24 (nebo např. 12-25, 01-07).",target:"MM-DD HH:MM nebo HH:MM (použije datum svátku). Výchozí 12-24 18:00.",eta:"Místní čas příletu ve 24hodinovém formátu (výchozí 23:59).",tz:"IANA pásmo, např. Europe/Prague (jinak se použije pásmo HA).",df:"Kódy: YYYY, MM, DD, HH, mm, ss.",hb:"Cesta Lovelace, např. /lovelace/0 (přidá kartu Domů).",store:"Ukládá děti a body; použije todo.nordpol_nice_list, pokud existuje.",log:"Volitelná entita input_text; jinak se deník ukládá do seznamu úkolů.",elf_ent:"Stav ve formátu Jméno|Vtip? Odpověď|Úkol."}
};
const ED_KEY = {
  language:"lang", default_tab:"tab", date:"date", target:"target", until:"until", eta:"eta",
  store:"store", log_entity:"log", default_start:"dstart", log_lines:"llines",
  overlay:"ov", cctv_style:"cctv", date_format:"df", footer:"foot", glitch:"gl",
  home_button_path:"hb", snow:"snow", time_zone:"tz", title:"title", subtitle:"sub", entity:"elf_ent"
};
const ED_HKEY = {
  date:"date", target:"target", eta:"eta", time_zone:"tz", date_format:"df",
  home_button_path:"hb", store:"store", log_entity:"log", entity:"elf_ent"
};
const edOf = c => ED_T[langOf(c && typeof c==="object" ? c : null)] || ED_T.en;
const edHOf = c => ED_H[langOf(c && typeof c==="object" ? c : null)] || ED_H.en;
const mkLabel = cfg => (s, d) => { const k=ED_KEY[s&&s.name]; return (k && edOf(d && typeof d==="object" ? d : cfg)[k]) || (s&&s.name) || ""; };
const mkHelper = cfg => (s, d) => { const k=ED_HKEY[s&&s.name]; return (k && edHOf(d && typeof d==="object" ? d : cfg)[k]) || ""; };
function F(s,o){ return String(s).replace(/\{(\w+)\}/g,(_,k)=>o&&o[k]!=null?o[k]:""); }
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

const tzFmts = new Map();
function tzParts(tz, d){
  let f=tzFmts.get(tz);
  if(!f){ f=new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}); tzFmts.set(tz,f); }
  return f.formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});
}
/* wall-clock time in `tz` as a browser-local Date (for showing dates/clocks only – never subtract two of these) */
function nowInTz(tz, d = new Date()){
  if(!tz) return d;
  try{ const p=tzParts(tz,d); return new Date(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second,d.getMilliseconds()); }
  catch(e){ return d; }
}
/* absolute instant (ms) of a wall-clock time in `tz` (browser local time when tz is empty/invalid) – DST-safe */
function zonedMs(tz, y, mo, d, h=0, mi=0){
  const local=()=>new Date(y,mo,d,h,mi).getTime();
  if(!tz) return local();
  try{ const want=Date.UTC(y,mo,d,h,mi); let g=want;
    for(let i=0;i<3;i++){ const t=Math.floor(g/1000)*1000, p=tzParts(tz,new Date(t)); g=want-(Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-t); }
    return g; }catch(e){ return local(); }
}
function defaultTarget(c){
  const d=c&&c.date;
  if(d&&d!=="12-24") return d+" 00:00";
  return ["fr","es","nl","it","pt"].includes(langOf(c))?"12-25 00:00":"12-24 18:00";
}
/* `date: "MM-DD"` (default 12-24) moves the whole card to another celebration day, e.g. "12-25" or "01-07".
   Countdown target: config `target: "MM-DD HH:MM"` or `"HH:MM"` in HA/configured time zone (default 12-24 18:00 for da/en/de/sv/nb/fi/pl/cs, 12-25 00:00 for fr/es/nl/it/pt). */
/* returns {ms: absolute instant, wall: target as wall-clock Date} for wall-clock `now` in zone `tz` */
function xmasTarget(now = new Date(), c, tz) {
  let raw=c&&c.target?String(c.target).trim():"";
  if(/^\d{1,2}:\d{2}$/.test(raw)) raw=((c&&c.date)||"12-24")+" "+raw;
  if(!raw) raw=defaultTarget(c);
  const m=raw.match(/(\d+)-(\d+)\s+(\d+):(\d+)/)||[0,12,24,18,0];
  const mk=y=>new Date(y,+m[1]-1,+m[2],+m[3],+m[4]); let y=now.getFullYear(), t=mk(y);
  /* after the target the party lasts until the season ends (celebration date + 7 days, same as sleigh/elf), at least 2 days */
  const [cmo,cd]=dateMD(c); let seasonEnd=new Date(t.getFullYear()-1,cmo,cd+7);
  while(seasonEnd < t) seasonEnd=new Date(seasonEnd.getFullYear()+1,cmo,cd+7);
  const win = seasonEnd - t <= 31*86400000 ? Math.max(2*86400000, seasonEnd - t) : 2*86400000;
  if (now - t > win) t = mk(++y);
  return {ms:zonedMs(tz,y,+m[1]-1,+m[2],+m[3],+m[4]), wall:t};
}
/* [month0, day] from config `date: "MM-DD"` */
function dateMD(c){ const m=String((c&&c.date)||"12-24").match(/(\d+)-(\d+)/)||[0,12,24]; return [+m[1]-1,+m[2]]; }
/* year of the celebration day this moment belongs to (stays on the current one for 7 days afterwards) */
/* `now` is a wall-clock Date in the card's zone (nowInTz); the season rolls over at 00:00 on celebration date + 7 days */
function eventYear(now,c){ const [mo,d]=dateMD(c); let y=now.getFullYear(); if(now>=new Date(y,mo,d+7)) y++; return y; }
function css(el, s){ const st=document.createElement("style"); st.textContent=s; el.appendChild(st); }
/* true inside Home Assistant's card picker (its previews sit in an inert container in <hui-card-picker>) */
function inPicker(el){ let n=el; while(n){ if(n.nodeType===1 && (n.localName==="hui-card-picker" || n.hasAttribute("inert"))) return true; n=n.parentNode||n.host||null; } return false; }
const reducedMotion=()=>!!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
/* keyboard + screen-reader access for click / long-press targets */
function keyAct(el, label, fn, role){
  if(!el) return; el.tabIndex=0; el.setAttribute("role",role||"button"); if(label) el.setAttribute("aria-label",label);
  el.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); fn(e); } });
}
function longPress(el, ms, fn){
  let t=null; const start=e=>{t=setTimeout(()=>{t=null;fn(e);},ms)}; const stop=()=>{if(t){clearTimeout(t);t=null}};
  el.addEventListener("pointerdown",start); ["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev,stop));
  el.addEventListener("contextmenu",e=>e.preventDefault());
}
const blobCache = {};
function dataToBlobUrl(uri){
  if(!uri || !uri.startsWith("data:")) return uri;
  const key = uri.length + ":" + uri.slice(-64);
  if (blobCache[key]) return blobCache[key];
  const i = uri.indexOf(","); const mime = (uri.slice(5,i).split(";")[0])||"video/mp4";
  const bin = atob(uri.slice(i+1)); const arr = new Uint8Array(bin.length);
  for (let k=0;k<bin.length;k++) arr[k]=bin.charCodeAt(k);
  return blobCache[key] = URL.createObjectURL(new Blob([arr],{type:mime}));
}

/* ---------- global snow layer (shared, ref-counted) ---------- */
const Snow = { n:0, cv:null, raf:null, flakes:[],
  start(){ if(this.n++>0) return; const cv=this.cv=document.createElement("canvas");
    Object.assign(cv.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",pointerEvents:"none",zIndex:"5",opacity:".85"}); cv.setAttribute("aria-hidden","true");
    document.body.appendChild(cv); const ctx=cv.getContext("2d");
    const resize=()=>{cv.width=innerWidth;cv.height=innerHeight}; resize(); this._r=resize; addEventListener("resize",resize);
    const N = Math.min(90, Math.round(innerWidth*innerHeight/14000));
    this.flakes=Array.from({length:N},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*2.6+0.8,s:Math.random()*0.7+0.3,w:Math.random()*6.28}));
    const tick=()=>{ ctx.clearRect(0,0,cv.width,cv.height); ctx.fillStyle="rgba(255,255,255,.9)";
      for(const f of this.flakes){ f.y+=f.s*1.2; f.w+=0.01; f.x+=Math.sin(f.w)*0.4;
        if(f.y>cv.height+5){f.y=-5;f.x=Math.random()*cv.width}
        ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,6.283); ctx.fill(); }
      this.raf=requestAnimationFrame(tick); }; tick(); },
  stop(){ if(--this.n>0) return; this.n=0; cancelAnimationFrame(this.raf); removeEventListener("resize",this._r); this.cv&&this.cv.remove(); this.cv=null; }
};

/* ---------- HERO / COUNTDOWN ---------- */
class NordpolHero extends HTMLElement {
  static getStubConfig(){ return {snow:true}; }
  static getConfigForm(){
    return {
      schema:[
        {type:"grid", schema:[
          {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
          {name:"date", selector:{text:{}}}
        ]},
        {type:"grid", schema:[
          {name:"title", selector:{text:{}}},
          {name:"subtitle", selector:{text:{}}}
        ]},
        {type:"grid", schema:[
          {name:"target", selector:{text:{}}},
          {name:"until", selector:{text:{}}}
        ]},
        {name:"time_zone", selector:{text:{}}},
        {name:"snow", default:true, selector:{boolean:{}}}
      ],
      assertConfig(c){ assertObj(c); },
      computeLabel: mkLabel(),
      computeHelper: mkHelper()
    };
  }
  setConfig(c){ this._t=T(c); const tr=TRaw(c); this._c = Object.assign({title:tr.hero_title, subtitle:tr.hero_sub, snow:true}, c||{}); this._build(); this._applySnow(); }
  /* the page-wide snow layer follows the config live (also when the editor changes it on a mounted card) */
  /* HA sets preview=true in the card editor; the picker is detected from the DOM. Neither starts the page-wide snow. */
  set preview(v){ this._preview=!!v; this._applySnow(); }
  get preview(){ return !!this._preview; }
  _applySnow(){ const want=this.isConnected && !!this._c && this._c.snow!==false && !this._preview && !inPicker(this) && !reducedMotion();
    if(want && !this._snow){ Snow.start(); this._snow=true; } else if(!want && this._snow){ Snow.stop(); this._snow=false; } }
  set hass(h){ const first=!this._hass; this._hass=h; if(first) this._tick(); }
  getCardSize(){ return 4; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  _build(){
    const r = this.shadowRoot || this.attachShadow({mode:"open"}); r.innerHTML=""; this._built=false;
    css(r, BASE_CSS + `
    /* sizes follow the card's own width (container query units), not the screen width */
    .np{container-type:inline-size}
    .hero{padding:26px 16px 22px;text-align:center}
    .t{font-family:${FONT_X};font-size:clamp(28px,11cqi,64px);font-weight:700;color:#ffd878;line-height:1.05;
       text-shadow:0 0 18px rgba(255,205,90,.7),0 3px 0 #8d0f19,0 6px 18px rgba(0,0,0,.6)}
    .st{margin-top:4px;color:#d9f3e3;font-size:clamp(11px,3.6cqi,17px);letter-spacing:clamp(1px,.4cqi,2px);text-transform:uppercase;opacity:.9}
    .lbl{margin:18px 0 8px;font-size:clamp(14px,4.4cqi,20px);color:#fff;font-weight:600}
    .cd{display:flex;justify-content:center;gap:clamp(4px,2cqi,16px);flex-wrap:nowrap}
    .u{flex:0 1 112px;min-width:0;box-sizing:border-box;padding:10px 4px 8px;border-radius:16px;
       background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04));border:1px solid rgba(255,214,120,.45);
       box-shadow:inset 0 -3px 0 rgba(214,32,47,.7),0 6px 16px rgba(0,0,0,.35)}
    .v{font-size:clamp(22px,9cqi,64px);font-weight:800;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 0 14px rgba(255,255,255,.45)}
    .k{font-size:clamp(8px,2.6cqi,13px);text-transform:uppercase;letter-spacing:clamp(.3px,.3cqi,1.5px);color:#ffd878;overflow-wrap:anywhere;line-height:1.2}
    .sl{margin-top:16px;display:inline-flex;align-items:center;gap:10px;padding:8px clamp(10px,3cqi,18px);border-radius:999px;max-width:100%;box-sizing:border-box;
       background:rgba(14,110,58,.55);border:1px solid rgba(126,240,168,.55);font-size:clamp(13px,4.2cqi,22px);font-weight:700}
    .moons{letter-spacing:2px}
    .tree{position:absolute;bottom:-6px;font-size:clamp(40px,9cqi,76px);opacity:.9;filter:drop-shadow(0 0 10px rgba(255,220,120,.5))}
    @container (max-width: 560px){.tree{display:none}}
    .tl{left:6px}.tr{right:6px}
    .lights{position:absolute;top:7px;left:0;right:0;display:flex;justify-content:space-around;pointer-events:none}
    .lights i{width:10px;height:14px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;margin-top:6px;animation:tw 1.6s infinite alternate}
    .lights i:nth-child(4n+1){background:#ff3b4a;box-shadow:0 0 10px #ff3b4a}
    .lights i:nth-child(4n+2){background:#ffd84a;box-shadow:0 0 10px #ffd84a;animation-delay:.4s}
    .lights i:nth-child(4n+3){background:#3bff8a;box-shadow:0 0 10px #3bff8a;animation-delay:.8s}
    .lights i:nth-child(4n){background:#4ac3ff;box-shadow:0 0 10px #4ac3ff;animation-delay:1.2s}
    @keyframes tw{from{opacity:.35;transform:scale(.85)}to{opacity:1;transform:scale(1.05)}}
    :host(.compact) .hero{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px 14px;text-align:left}
    :host(.compact) .hero>div:first-child{min-width:0;flex:1 1 auto}
    :host(.compact) .t{font-size:clamp(24px,2.8vw,46px)}
    :host(.compact) .st{font-size:clamp(10px,1.05vw,13px);letter-spacing:1.1px;line-height:1.25}
    :host(.compact) #body{display:flex;flex-direction:column;align-items:center;flex:0 1 auto;min-width:0}
    :host(.compact) .lbl{margin:0 0 6px;font-size:clamp(13px,1.5vw,18px)}
    :host(.compact) .cd{gap:clamp(6px,1vw,14px)}
    :host(.compact) .u{min-width:clamp(60px,6.4vw,98px);padding:8px 5px 6px}
    :host(.compact) .v{font-size:clamp(28px,3.6vw,52px)}
    :host(.compact) .k{font-size:clamp(9px,1vw,12px);letter-spacing:1px}
    :host(.compact) .sl{margin-top:8px;padding:6px 14px;font-size:clamp(12px,1.35vw,17px);line-height:1.2;text-align:center;max-width:100%;box-sizing:border-box}
    :host(.compact) .tree{display:none}
    @media (max-width: 600px){:host(.compact) .hero{flex-direction:column;text-align:center;gap:10px;padding:18px 14px 14px}
      :host(.compact) #body{align-self:stretch} :host(.compact) .u{min-width:0;flex:0 1 98px} :host(.compact) .v{font-size:clamp(22px,9cqi,52px)} :host(.compact) .k{font-size:clamp(8px,2.6cqi,12px)}}
    .party{font-size:clamp(28px,6vw,52px);font-family:${FONT_X};color:#ffd878;margin-top:14px}
    `);
    const lights = Array.from({length:18},()=>"<i></i>").join("");
    r.innerHTML += `<ha-card class="np"><div class="lights" aria-hidden="true">${lights}</div>
      <div class="hero"><div><div class="t">${esc(this._c.title)}</div><div class="st">${esc(this._c.subtitle)}</div></div>
      <div id="body"></div></div><div class="tree tl" aria-hidden="true">🎄</div><div class="tree tr" aria-hidden="true">🎁</div></ha-card>`;
    this._body = r.getElementById("body"); this._tick();
  }
  _tick(){
    const tz=this._c.time_zone||(this._hass&&this._hass.config&&this._hass.config.time_zone), nowMs=Date.now(), now=nowInTz(tz,new Date(nowMs));
    const T=xmasTarget(now,this._c,tz), t=T.wall, L=this._t; let ms = T.ms - nowMs;
    if (ms <= 0) {
      this._body.innerHTML = `<div class="party">${L.party}</div><div class="lbl">${L.party_sub}</div>`; this._built=false;
      return;
    }
    const d=Math.floor(ms/86400000), h=Math.floor(ms/3600000)%24, m=Math.floor(ms/60000)%60, s=Math.floor(ms/1000)%60;
    const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const xd = new Date(t.getFullYear(),t.getMonth(),t.getDate());
    const nights = Math.round((xd - today)/86400000);   /* nights until the target date (0 on the day) */
    const nightTxt = nights<=0 ? L.n_zero : nights===1 ? L.n_one : F(L.n_many,{n:nights});
    const moons = nights>0 && nights<=10 ? `<span class="moons" title="${F(L.n_title,{n:nights})}">${"🌙".repeat(nights)}</span>` : nights<=0 ? "" : "🌙";
    if(!this._built){
      this._body.innerHTML = `<div class="lbl">${this._c.until?esc(this._c.until):L.until}</div><div class="cd" role="timer" aria-live="off">
        <div class="u"><div class="v" id="d"></div><div class="k">${L.u_d}</div></div>
        <div class="u"><div class="v" id="h"></div><div class="k">${L.u_h}</div></div>
        <div class="u"><div class="v" id="m"></div><div class="k">${L.u_m}</div></div>
        <div class="u"><div class="v" id="s"></div><div class="k">${L.u_s}</div></div></div>
        <div class="sl" id="sl"></div>`; this._built=true; }
    const g=id=>this.shadowRoot.getElementById(id);
    g("d").textContent=d; g("h").textContent=pad(h); g("m").textContent=pad(m); g("s").textContent=pad(s);
    const al=`${d} ${L.u_d}, ${h} ${L.u_h}, ${m} ${L.u_m}`; const cdEl=this.shadowRoot.querySelector(".cd"); if(cdEl && cdEl.getAttribute("aria-label")!==al) cdEl.setAttribute("aria-label",al);
    g("sl").innerHTML = `${moons} <span>${nightTxt}</span>`;
  }
  connectedCallback(){ clearInterval(this._iv); this._iv=setInterval(()=>this._tick(),1000); this._applySnow(); }
  disconnectedCallback(){ clearInterval(this._iv); this._applySnow(); }
}

/* ---------- SURVEILLANCE CAM WALL ---------- */
const DEFAULT_CAMS = [{label:"CAM 01 – REINDEER PADDOCK"},{label:"CAM 02 – TOY WORKSHOP"},{label:"CAM 03 – MAILROOM"},{label:"CAM 04 – BAKERY"}];
class NordpolCams extends HTMLElement {
  static getStubConfig(){ return {cams:DEFAULT_CAMS.map(x=>Object.assign({},x))}; }
  static getConfigForm(){
    return {
      schema:[
        {type:"grid", schema:[
          {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
          {name:"title", selector:{text:{}}}
        ]},
        {type:"grid", schema:[
          {name:"overlay", default:"minimal", selector:{select:{mode:"dropdown", options:OV_OPTS}}},
          {name:"cctv_style", default:"color", selector:{select:{mode:"dropdown", options:CCTV_OPTS}}}
        ]},
        {type:"grid", schema:[
          {name:"date_format", selector:{text:{}}},
          {name:"time_zone", selector:{text:{}}}
        ]},
        {name:"footer", selector:{text:{}}},
        {name:"glitch", default:true, selector:{boolean:{}}}
      ],
      assertConfig(c){ assertObj(c); if(c.cams!==undefined && !Array.isArray(c.cams)) throw new Error("cams must be a list"); },
      computeLabel: mkLabel(),
      computeHelper: mkHelper()
    };
  }
  setConfig(c){ this._t=T(c); this._tr=TRaw(c); this._c = Object.assign({title:this._tr.cam_title, cams:DEFAULT_CAMS, lost_label:this._tr.cam_lost_label, glitch:true}, c||{}); this._blob={}; this._build(); }
  set hass(h){ const first=!this._hass; this._hass=h; if(first){ this._clock(); this._update(true); } }
  getCardSize(){ return 6; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  _build(){
    const r = this.shadowRoot || this.attachShadow({mode:"open"}); r.innerHTML="";
    css(r, BASE_CSS + `
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .grid.one{grid-template-columns:1fr}
    .tile{position:relative;aspect-ratio:16/9;container-type:inline-size;border-radius:10px;overflow:hidden;background:#000;cursor:pointer;
       border:2px solid #1d2a1d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.6)}
    .tile video,.tile canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.15) brightness(.95)}
    .tile canvas{image-rendering:pixelated}
    .scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);
       box-shadow:inset 0 0 40px rgba(0,0,0,.85);mix-blend-mode:multiply}
    .ov{position:absolute;inset:0;pointer-events:none;font-family:"Courier New",ui-monospace,monospace;color:#f2f2f2;
       text-shadow:0 0 3px #000,0 0 6px #000;font-size:clamp(8.5px,3.9cqi,13.5px);font-weight:700}
    .rec{position:absolute;top:6px;left:8px;display:flex;align-items:center;gap:5px}
    .dot{width:.72em;height:.72em;border-radius:50%;background:#ff2230;box-shadow:0 0 8px #ff2230;animation:bl 1s steps(1) infinite}
    @keyframes bl{50%{opacity:0}}
    .clk{position:absolute;top:6px;right:8px}
    .lab{position:absolute;bottom:6px;left:8px;right:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .lost{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;
       font-family:"Courier New",monospace;font-weight:700;color:#fff;text-shadow:0 0 6px #000;font-size:clamp(12px,2.6vw,18px);letter-spacing:2px}
    .lost span{background:rgba(0,0,0,.6);padding:3px 8px;border-radius:4px}
    .gl{display:none}.tile.glitch .gl{display:flex}.tile.glitch video{filter:grayscale(1) blur(2px) contrast(2)}
    .tile[data-kind=none] .gl{display:flex}.tile[data-kind=none] video{display:none}
    .tile[data-kind=preview] canvas.gl{display:block;opacity:.3}.tile[data-kind=preview] video{display:none}
    .lost .rs{display:none;font-size:.7em}.tile[data-kind=none] .lost .rs,.lostT .lost .rs{display:inline}
    .tile.blip canvas.gl{display:block;opacity:.22;mix-blend-mode:screen}
    .tile.blip video{filter:contrast(1.15) brightness(1.08)}
    :host(.fill){height:100%}
    :host(.fill) ha-card{height:100%;display:flex;flex-direction:column;box-sizing:border-box}
    :host(.fill) .bd{flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 14px 10px}
    :host(.fill) .wrap{flex:1;min-height:0;container-type:size;display:flex;align-items:center;justify-content:center}
    :host(.fill) .grid{--tw:min(calc((100cqw - 10px)/2),calc((100cqh - 10px)/2*16/9));grid-template-columns:repeat(2,var(--tw));gap:10px}
    :host(.fill) .grid.one{--tw:min(100cqw,calc(100cqh*16/9));grid-template-columns:var(--tw)}
    :host(.fill) .tile{aspect-ratio:16/9;width:var(--tw)}
    :host(.fill) .hd{font-size:clamp(17px,2vw,25px);padding:14px 16px 6px;gap:8px;white-space:nowrap}
    :host(.fill) .hd small{font-size:clamp(10px,1vw,12px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex-shrink:1}
    @media (max-width: 560px){:host(.fill) .hd{white-space:normal;flex-wrap:wrap}:host(.fill) .hd small{white-space:normal}}
    .mini{display:none;position:absolute;bottom:7px;right:9px;width:6px;height:6px;border-radius:50%;background:#ff2230;opacity:.7;box-shadow:0 0 4px #ff2230;animation:bl 1.4s steps(1) infinite;pointer-events:none}
    .tile[data-kind=file] video{filter:none;object-fit:contain}
    .np:not(.cctv) .tile[data-kind=file] .scan,.np:not(.cctv) .tile[data-kind=file] .ov{display:none}
    .np:not(.cctv) .tile[data-kind=file] .mini{display:block}
    /* live CCTV look on top of real clips (overlay:true, the default). cctv_style: color | mono */
    .np.cctv .tile[data-kind=file] video{object-fit:cover;filter:saturate(.6) contrast(1.08) brightness(.96)}
    .np.cctv.st-mono .tile[data-kind=file] video{filter:grayscale(1) contrast(1.15) brightness(.95)}
    .np.cctv .tile[data-kind=file] .scan{opacity:.7}
    .np.min .tile[data-kind=file] video{object-fit:cover;filter:none}
    .np.min .tile[data-kind=file] .scan{display:none}
    .tile[data-kind=file]{border-color:#2a3550}
    .foot{margin-top:6px;font-size:11px;color:#cfe8d8;opacity:.85;text-align:center}
    `);
    const cams = this._c.cams || []; const L=this._t;
    const tiles = cams.map((c,i)=>`<div class="tile" data-i="${i}"><video muted playsinline loop autoplay preload="auto"></video>
      <canvas class="gl" width="96" height="72"></canvas><div class="lost gl"><span>${L.cam_lost}</span><span class="rs">${L.cam_restore}</span></div>
      <div class="scan"></div><div class="ov"><div class="rec"><i class="dot"></i>REC</div><div class="clk"></div><div class="lab">${esc(c.label||("CAM "+(i+1)))}</div></div><i class="mini"></i></div>`).join("");
    const lost = `<div class="tile lostT"><canvas width="96" height="72" style="display:block"></canvas><div class="lost"><span>${L.cam_lost}</span><span class="rs">${L.cam_restore}</span></div>
      <div class="scan"></div><div class="ov"><div class="rec"><i class="dot"></i>REC</div><div class="clk"></div><div class="lab">${esc(this._c.lost_label)}</div></div></div>`;
    const showLost = cams.length > 1 && cams.length % 2 === 1 && this._c.fill_lost !== false;
    const ov=this._ov(); r.innerHTML += `<ha-card class="np ${ov!==false?"cctv":""} ${ov==="minimal"?"min":"st-"+esc(this._c.cctv_style||"color")}"><div class="hd">${esc(this._c.title)}<small>${L.cam_live} · <span class="per"></span> · ${L.cam_tap}</small></div>
      <div class="bd"><div class="wrap"><div class="grid${cams.length===1?" one":""}">${tiles}${showLost?lost:""}</div></div>
      <div class="foot">${this._c.footer!=null?esc(this._c.footer):L.cam_foot}</div></div></ha-card>`;
    this._vids=[...r.querySelectorAll("video")];
    this._vids.forEach((v,i)=>{ v.muted=true; v.defaultMuted=true;
      v.addEventListener("error",()=>{ if(v.dataset.kind==="file"){ this._exists[v.dataset.url]={ok:false,t:Date.now()}; this._update(true); } }); });
    this._exists = this._exists || {};
    this._update(true);
    r.querySelectorAll(".tile[data-i]").forEach(t=>{ t.addEventListener("click",()=>this._full(+t.dataset.i));
      const cc=(this._c.cams||[])[+t.dataset.i]||{}; keyAct(t, cc.label||`Cam ${+t.dataset.i+1}`, ()=>this._full(+t.dataset.i)); });
    this._canv=[...r.querySelectorAll("canvas")];
  }
  /* overlay: "minimal" (default: REC, clock, label only) | true/"cctv" (+ scanlines, vignette, muted colours) | false/"off" */
  _ov(){ const o=this._c.overlay; if(o===false||o==="false"||o==="off") return false; if(o===true||o==="true"||o==="cctv") return true; return "minimal"; }
  _now(){ return nowInTz(this._c.time_zone||(this._hass&&this._hass.config&&this._hass.config.time_zone)); }
  _periods(){ const P=(this._c.periods||CAM_PERIODS).map(p=>{const [h,m]=String(p.from).split(":").map(Number); return {name:p.name,min:h*60+(m||0)};}).sort((a,b)=>a.min-b.min); return P; }
  _period(now=this._now()){ const P=this._periods(); const m=now.getHours()*60+now.getMinutes(); let cur=P[P.length-1];
    for(const p of P) if(m>=p.min) cur=p; return cur.name; }
  _fallback(i){ const c=this._c.cams[i]; if(!c||!c.src) return ""; if(!this._blob) this._blob={}; if(this._blob[i]) return this._blob[i];
    if(!c.src.startsWith("data:")) return c.src; try{ return (this._blob[i]=dataToBlobUrl(c.src)); }catch(e){ return ""; } }
  _setNone(i){ const v=this._vids[i]; if(!v||v.dataset.kind==="none") return; v.removeAttribute("src"); v.dataset.src=""; v.dataset.kind="none"; v.load&&v.load();
    const tile=v.closest(".tile"); if(tile) tile.dataset.kind="none"; }
  _fileUrl(i,per){ const c=this._c.cams[i]; const dir=(this._c.file_dir||CAM_FILE_DIR).replace(/\/$/,"");
    const base=c.file||`${dir}/cam${i+1}`; return `${base}_${per}.mp4?v=${VER}`; }
  /* Local clips are only looked for when you opt in (prefer_files: true, file_dir, cams[].file or remote: false), so the
     default hosted-clip setup makes no /local requests and no 404s in the console. */
  _localOn(){ const c=this._c; if(c.prefer_files===false) return false;
    return c.prefer_files===true || !!c.file_dir || c.remote===false || (c.cams||[]).some(x=>x&&x.file); }
  async _probe(url){ const e=this._exists[url]; if(e && Date.now()-e.t < CAM_RECHECK_MIN*60000) return e.ok;
    const fl=this._inflight=this._inflight||{}; if(fl[url]) return fl[url];      /* never probe the same URL twice at once */
    return fl[url]=(async()=>{ let ok=false; try{ const r=await fetch(url,{method:"HEAD",cache:"no-store"}); ok=r.ok && /^video\//i.test(r.headers.get("content-type")||""); }catch(err){ ok=false; }
      this._exists[url]={ok,t:Date.now()}; delete fl[url]; return ok; })(); }
  _setSrc(i,src,kind,url){ const v=this._vids[i]; if(!v||!src||v.dataset.src===src) return;
    v.dataset.src=src; v.dataset.kind=kind; v.dataset.url=url||""; v.src=src; const p=v.play&&v.play(); p&&p.catch&&p.catch(()=>{});
    const tile=v.closest(".tile"); if(tile) tile.dataset.kind=kind; }
  /* one update at a time: calls that arrive meanwhile are merged into a single follow-up run */
  _update(force){ if(!this._vids) return Promise.resolve();
    if(this._busy){ this._again = this._again===true || force===true ? true : "soft"; return this._busy; }
    return this._busy=this._doUpdate(force).finally(()=>{ this._busy=null; const a=this._again; this._again=false; if(a) this._update(a===true); }); }
  async _doUpdate(force){ if(!this._vids || !this.isConnected) return; const per=this._period();
    if(inPicker(this)){ this._showPreview(); return; }
    if(!force && per===this._per && Date.now()-(this._lastProbe||0) < CAM_RECHECK_MIN*60000) return;
    this._per=per; this._lastProbe=Date.now();
    /* order: local file for the period → same cam's other periods → explicit src → hosted release clip (remote!==false) → "signal lost" */
    const order=[per,...this._periods().map(p=>p.name).filter(n=>n!==per)];
    await Promise.all(this._vids.map(async (v,i)=>{
      if(this._localOn()) for(const n of order){ const url=this._fileUrl(i,n);
        if(await this._probe(url)){ this._setSrc(i,url,"file",url); return; } }
      const fb=this._fallback(i); if(fb){ this._setSrc(i,fb,"embed"); return; }
      if(this._c.remote!==false && !this._c.cams[i]?.file){
        const rdir=(this._c.remote_dir||CAM_REMOTE_DIR).replace(/\/$/,"");
        const rurl=`${rdir}/cam${i+1}_${per}.mp4`;
        const cached=this._exists[rurl];
        if(!cached || cached.ok || Date.now()-cached.t >= CAM_RECHECK_MIN*60000){ this._setSrc(i,rurl,"file",rurl); return; }
      }
      this._setNone(i); }));
    const pl=this.shadowRoot.querySelector(".per"); if(pl) pl.textContent=(this._c.period_labels||this._tr.periods)[per]||per; }
  _showPreview(){ for(const t of this.shadowRoot.querySelectorAll(".tile[data-i]")) t.dataset.kind="preview"; this._noise(true); }
  _noise(once){
    if (document.hidden) return;
    if (!once && reducedMotion()){ if(this._noiseDone) return; this._noiseDone=true; }   /* reduced motion: one static frame */
    for (const cv of this._canv){
      if (cv.classList.contains("gl")){ const tl=cv.closest(".tile"); if(!(tl.classList.contains("glitch")||tl.classList.contains("blip")||tl.dataset.kind==="none"||(once&&tl.dataset.kind==="preview"))) continue; }
      const ctx=cv.getContext("2d"); const id=ctx.createImageData(cv.width,cv.height); const d=id.data;
      for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255}
      ctx.putImageData(id,0,0);
      ctx.fillStyle="rgba(0,0,0,.35)"; ctx.fillRect(0,(Date.now()/30)%cv.height,cv.width,6);
    }
  }
  _clock(){
    const n=this._now(); const s=(this._c.date_format||"DD-MM-YYYY HH:mm:ss").replace(/YYYY|MM|DD|HH|mm|ss/g,k=>({YYYY:n.getFullYear(),MM:pad(n.getMonth()+1),DD:pad(n.getDate()),HH:pad(n.getHours()),mm:pad(n.getMinutes()),ss:pad(n.getSeconds())}[k]));
    this.shadowRoot.querySelectorAll(".clk").forEach(e=>e.textContent=s);
    if(this._fsClk) this._fsClk.textContent=s;
  }
  _glitch(){
    if(!this._c.glitch || reducedMotion()) return; const tiles=[...this.shadowRoot.querySelectorAll(".tile[data-i][data-kind=embed]")];
    if(tiles.length){ const t=tiles[Math.random()*tiles.length|0]; t.classList.add("glitch"); setTimeout(()=>t.classList.remove("glitch"), 900+Math.random()*900); }
    /* real files: only a short, faint flicker (~every 30–45 s) */
    const real=[...this.shadowRoot.querySelectorAll(".tile[data-i][data-kind=file]")];
    if(real.length && Math.random()<0.25){ const t=real[Math.random()*real.length|0]; t.classList.add("blip"); setTimeout(()=>t.classList.remove("blip"), 250+Math.random()*200); }
  }
  _full(i){
    const c=this._c.cams[i]; const v=this._vids[i]; if(!c||!v||v.dataset.kind==="none") return;
    const m=document.createElement("div"); const real=v.dataset.kind==="file" && this._ov()===false; const minimal=v.dataset.kind==="file" && this._ov()==="minimal";
    const FILT={color:"saturate(.6) contrast(1.08)",mono:"grayscale(1) contrast(1.15)"};
    const fl=v.dataset.kind==="file"?(minimal?"none":(FILT[this._c.cctv_style]||FILT.color)):FILT.mono;
    m.innerHTML=real?`<div style="position:relative;width:min(96vw,calc(90vh*16/9));aspect-ratio:16/9;background:#000;border:2px solid #333;border-radius:10px;overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.9)">
      <video muted playsinline loop autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"></video>
      <span class="npd" style="position:absolute;bottom:12px;right:14px;width:9px;height:9px;border-radius:50%;background:#ff2230;opacity:.75;box-shadow:0 0 6px #ff2230"></span></div>`
    :`<div style="position:relative;width:min(96vw,1100px);aspect-ratio:16/9;max-height:90vh;background:#000;border:2px solid #333;border-radius:10px;overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.9)">
      <video muted playsinline loop autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:${fl}"></video>
      <div class="npscan" style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.25) 0 1px,transparent 1px 3px);box-shadow:inset 0 0 90px rgba(0,0,0,.9)"></div>
      <div style="position:absolute;top:12px;left:14px;font:700 clamp(14px,2.5vw,24px) 'Courier New',monospace;color:#fff;text-shadow:0 0 4px #000"><span class="npd" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#ff2230;box-shadow:0 0 10px #ff2230;margin-right:8px"></span>REC</div>
      <div class="npc" style="position:absolute;top:12px;right:14px;font:700 clamp(14px,2.5vw,24px) 'Courier New',monospace;color:#fff;text-shadow:0 0 4px #000"></div>
      <div style="position:absolute;bottom:12px;left:14px;font:700 clamp(14px,2.5vw,24px) 'Courier New',monospace;color:#fff;text-shadow:0 0 4px #000">${esc(c.label||"")}</div>
      <div style="position:absolute;bottom:12px;right:14px;font:600 13px system-ui;color:#ddd;opacity:.8">${this._t.cam_close}</div></div>`;
    Object.assign(m.style,{position:"fixed",inset:"0",zIndex:"10000",background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center"});
    if(minimal){ const sc=m.querySelector(".npscan"); if(sc) sc.remove(); }
    document.body.appendChild(m); const fv=m.querySelector("video"); fv.muted=true; fv.src=v.src; fv.play&&fv.play().catch(()=>{});
    this._fsClk=m.querySelector(".npc")||null; const dot=m.querySelector(".npd"); const bl=reducedMotion()?0:setInterval(()=>{dot.style.opacity=dot.style.opacity==="0"?"1":"0"},500);
    m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true"); m.setAttribute("aria-label",c.label||"Cam"); m.tabIndex=-1;
    const back=this.shadowRoot.querySelector(`.tile[data-i="${i}"]`);
    const close=()=>{ clearInterval(bl); this._fsClk=null; m.remove(); document.removeEventListener("keydown",onKey,true); back&&back.focus&&back.focus(); };
    const onKey=e=>{ if(e.key==="Escape"||e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); close(); } else if(e.key==="Tab"){ e.preventDefault(); m.focus(); } };
    m.addEventListener("click",close); document.addEventListener("keydown",onKey,true); m.focus&&m.focus();
    this._clock();
  }
  connectedCallback(){
    this._iv=setInterval(()=>this._clock(),1000);
    this._update(true);
    if(inPicker(this)) return;          /* card picker preview: static tiles, no clips, no probes, no animation timers */
    this._pv=setInterval(()=>this._update(false),30000);
    this._nv=setInterval(()=>this._noise(),80);
    this._gv=setInterval(()=>this._glitch(), 7000+Math.random()*5000);
    (this._vids||[]).forEach(v=>{const p=v.play&&v.play(); p&&p.catch&&p.catch(()=>{});});
  }
  disconnectedCallback(){ clearInterval(this._iv); clearInterval(this._nv); clearInterval(this._gv); clearInterval(this._pv); }
}

/* ---------- NAUGHTY / NICE (children + scores stored in a HA to-do list) ----------
   Each child = one open to-do item: summary = name, description = {"emoji":"🧒","score":75,"start":75}.
   The elf log is either an input_text (log_entity) or a completed to-do item called "📜 log" in the same list. */
const LOG_ITEM = "📜 log";
const clamp100 = v => Math.max(0, Math.min(100, Math.round(+v || 0)));
class NordpolNice extends HTMLElement {
  static getStubConfig(hass, entities){ return hasDefaultTodo(hass, entities) ? {store:"todo.nordpol_nice_list"} : {}; }
  static getConfigForm(){
    return {
      schema:[
        {type:"grid", schema:[
          {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
          {name:"title", selector:{text:{}}}
        ]},
        {name:"store", selector:{entity:{filter:{domain:"todo"}}}},
        {name:"log_entity", selector:{entity:{filter:{domain:"input_text"}}}},
        {type:"grid", schema:[
          {name:"default_start", default:75, selector:{number:{min:0, max:100, step:1, mode:"box"}}},
          {name:"log_lines", default:4, selector:{number:{min:0, max:30, step:1, mode:"box"}}}
        ]}
      ],
      assertConfig(c){ assertObj(c); },
      computeLabel: mkLabel(),
      computeHelper: mkHelper()
    };
  }
  setConfig(c){ const prev=this._c ? this._store() : undefined;
    this._c=Object.assign({store:null, log_entity:null, default_start:75, log_lines:4}, c||{}); this._t=T(this._c); this._tr=TRaw(this._c);
    this._parent=false; this._built=false; this._edit=false;
    /* a different to-do list (e.g. picked in the editor) → drop the old subscription and load the new one */
    if(prev!==undefined && prev!==this._store()){ this._pend={}; this._logMem=null; this._logMade=false; this._retry(); return; }
    if(this._hass) this._render(); }
  _store(){
    if(this._c.store) return this._c.store;
    return this._hass && this._hass.states["todo.nordpol_nice_list"] ? "todo.nordpol_nice_list" : null;
  }
  set hass(h){ const old=this._hass; this._hass=h; this._sub();
    if(this._logMem && this._c.log_entity){ const st=h.states[this._c.log_entity]; if(st && st.state===this._logMem.lines.join(" • ")) this._logMem=null; }
    if(!old) this._render(); else if(this._c.log_entity && old.states[this._c.log_entity]!==h.states[this._c.log_entity]) this._renderLog(); }
  getCardSize(){ return 5; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  connectedCallback(){ this._sub(); }
  disconnectedCallback(){ clearTimeout(this._pt); clearTimeout(this._lt); this._gen=(this._gen||0)+1; this._fbBusy=false; const u=this._unsub; this._unsub=null; this._subbed=false; if(typeof u==="function") try{u()}catch(e){} }
  /* Load order: live subscription (todo/item/subscribe) → one-shot todo/item/list → todo.get_items service.
     None of these need admin. If nothing arrives within 6 s we fall back, and any final failure is shown in the card. */
  async _sub(){
    const st=this._store();
    if(this._subbed || !this._hass || !st || !this.isConnected || Date.now()<(this._nextTry||0)) return;
    if(!this._hass.states[st]){ if(!this._err){ this._fail(F(this._tr.load_err,{store:st, err:this._tr.no_entity})); } return; }
    this._subbed=true;
    const gen=this._gen=(this._gen||0)+1; const live=()=>gen===this._gen && this.isConnected;
    clearTimeout(this._lt); this._lt=setTimeout(()=>{ if(live() && !this._items) this._fallback(gen); }, 6000);
    try{
      const u = await this._hass.connection.subscribeMessage(m=>{ if(gen!==this._gen) return; this._gotItems(m&&m.items); },
        {type:"todo/item/subscribe", entity_id:st});
      if(!live()){ try{u()}catch(e){} return; } this._unsub=u;
    }catch(e){ if(live()) this._fallback(gen, e); }
  }
  async _fallback(gen, firstErr){
    if(this._fbBusy) return; this._fbBusy=true; let err=firstErr;
    try{ const st=this._store(); if(!st){this._fbBusy=false;return;}
    const r=await this._hass.callWS({type:"todo/item/list", entity_id:st}); if(gen===this._gen){ this._gotItems(r&&r.items); } this._fbBusy=false; return; }
    catch(e){ err=e; }
    try{ const r=await this._hass.callService("todo","get_items",{},{entity_id:st},false,true);
      const resp=(r&&r.response)||{}; const it=(resp[st]||{}).items; if(Array.isArray(it)){ if(gen===this._gen) this._gotItems(it); this._fbBusy=false; return; } }
    catch(e){ err=e; }
    this._fbBusy=false; if(gen!==this._gen) return; this._subbed=false; this._nextTry=Date.now()+30000;
    if(!this._items) this._fail(F(this._tr.load_err,{store:st, err:String((err&&(err.message||err.code))||err||"timeout")}));
  }
  _gotItems(items){ clearTimeout(this._lt); this._nextTry=0; this._items=Array.isArray(items)?items:[]; this._err=null;
    /* drop local (optimistic) values once Home Assistant has caught up with them */
    const P=this._pend||{}; for(const uid of Object.keys(P)){ const it=this._items.find(i=>i.uid===uid); let sc=null; try{ sc=JSON.parse((it&&it.description)||"{}").score; }catch(e){}
      if(!it || sc===P[uid].score) delete P[uid]; }
    const lg=this._items.find(i=>i.summary===LOG_ITEM); if(this._logMem && !this._c.log_entity && lg && lg.description===this._logMem.lines.slice(0,30).join("\n")) this._logMem=null;
    if(lg) this._logMade=false;
    this._render(); }
  _fail(msg){ clearTimeout(this._lt); this._err=msg; this._render(); }
  _retry(){ this._gen=(this._gen||0)+1; const u=this._unsub; this._unsub=null; if(typeof u==="function") try{u()}catch(e){}
    this._subbed=false; this._fbBusy=false; this._nextTry=0; this._items=null; this._err=null; this._render(); this._sub(); }
  _kids(){ return (this._items||[]).filter(i=>i && i.status!=="completed" && i.summary && i.summary!==LOG_ITEM).map(i=>{ let d={}; try{ d=JSON.parse(i.description||"{}")||{}; if(typeof d!=="object") d={}; }catch(e){}
    const start=clamp100(d.start!=null?d.start:this._c.default_start); return {uid:i.uid, name:i.summary, emoji:d.emoji||"🧒", start, score:this._pendScore(i.uid, clamp100(d.score!=null?d.score:start)), d}; }); }
  /* taps are applied locally first, so quick taps never compute from a stale score */
  _pendScore(uid, v){ const p=this._pend&&this._pend[uid]; return p && Date.now()-p.t<10000 ? p.score : v; }
  _setScore(k, score){ const P=this._pend=this._pend||{}; P[k.uid]={score, t:Date.now()}; this._render();
    return this._saveKid(k,{score}).catch(err=>{ if(P[k.uid]&&P[k.uid].score===score) delete P[k.uid]; this._fail(String((err&&err.message)||err)); }); }
  _svc(s,data){ const p=this._hass.callService("todo", s, data, {entity_id:this._store()});
    // Without a live subscription (fallback mode) re-read the list after every change so the card stays current.
    p.then(()=>{ if(!this._unsub){ this._subbed=false; this._nextTry=0; const g=this._gen=(this._gen||0)+1; this._subbed=true; this._fallback(g); } }).catch(()=>{});
    return p; }
  _saveKid(k,patch){ const d=Object.assign({}, k.d, {emoji:k.emoji, score:k.score, start:k.start}, patch||{}); return this._svc("update_item", {item:k.uid, description:JSON.stringify(d)}); }
  _logLines(){
    if(this._logMem && Date.now()-this._logMem.t<10000) return this._logMem.lines.slice();
    if(this._c.log_entity){ const s=this._hass&&this._hass.states[this._c.log_entity]; const v=s&&s.state; return v&&!["unknown","unavailable",""].includes(v)?v.split(" • "):[]; }
    const it=(this._items||[]).find(i=>i.summary===LOG_ITEM); return it&&it.description?it.description.split("\n").filter(Boolean):[]; }
  /* Log lines are kept locally and written one at a time (each write sends the newest text), so quick taps never
     overwrite each other and the "📜 log" to-do item is created only once. */
  _log(line, replace){
    const lines = (replace ? [line] : [line, ...this._logLines()]).slice(0,60);
    this._logMem={lines, t:Date.now()}; this._renderLog();
    this._logQ=(this._logQ||Promise.resolve()).then(()=>this._writeLog()).catch(err=>this._fail(String((err&&err.message)||err)));
    return this._logQ; }
  async _writeLog(){
    const lines=(this._logMem&&this._logMem.lines)||this._logLines();
    if(this._c.log_entity){ const s=this._hass.states[this._c.log_entity]; const max=(s&&s.attributes&&s.attributes.max)||255;
      const v=Array.from(lines.join(" • ")).slice(0,max).join(""); return this._hass.callService("input_text","set_value",{value:v},{entity_id:this._c.log_entity}); }
    const desc=lines.slice(0,30).join("\n"); const it=(this._items||[]).find(i=>i.summary===LOG_ITEM);
    if(it) return this._svc("update_item",{item:it.uid, description:desc});
    if(this._logMade) return this._svc("update_item",{item:LOG_ITEM, description:desc});
    await this._svc("add_item",{item:LOG_ITEM, description:desc}); this._logMade=true;
    return this._svc("update_item",{item:LOG_ITEM, status:"completed"}); }
  _level(v){ const L=this._t.lv; return v>=90?[L[4],"#7ef0a8"]:v>=70?[L[3],"#b6f07e"]:v>=45?[L[2],"#ffd878"]:v>=25?[L[1],"#ffad5a"]:[L[0],"#ff5a64"]; }
  _av(e){ return /^(\/|https?:)/.test(e) ? `<img src="${esc(e)}" alt="">` : esc(e); }
  _render(){
    if(!this._hass) return; const t=this._t; const r=this.shadowRoot||this.attachShadow({mode:"open"});
    if(!this._built){ r.innerHTML=""; css(r, BASE_CSS+`
      .kid{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;padding:10px 0;border-bottom:1px dashed rgba(255,214,120,.25)}
      .kid:last-of-type{border-bottom:none}
      .av{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;
          background:radial-gradient(circle at 30% 30%,#ffefc2,#e3a63a);box-shadow:0 0 0 3px #b3121f,0 4px 10px rgba(0,0,0,.4)}
      .av img{width:100%;height:100%;object-fit:cover}
      .nm{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:17px;gap:8px}
      .nm span{font-size:13px;font-weight:600;text-align:right}
      .bar{position:relative;height:18px;border-radius:999px;margin-top:6px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.2)}
      .fill{position:absolute;inset:0 auto 0 0;border-radius:999px;transition:width .8s cubic-bezier(.2,1.4,.4,1);
          background:linear-gradient(90deg,#d6202f,#ffb347 45%,#ffd878 60%,#2ecc71);background-size:var(--bw) 100%}
      .fill:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.28) 0 8px,transparent 8px 16px)}
      .star{position:absolute;top:-3px;font-size:18px;transition:left .8s cubic-bezier(.2,1.4,.4,1);transform:translateX(-50%);filter:drop-shadow(0 0 4px #ffd878)}
      .pb{display:none;gap:6px;margin-top:8px;flex-wrap:wrap}.parent .pb{display:flex}
      button{font:700 14px system-ui;border:none;border-radius:10px;padding:7px 12px;cursor:pointer;color:#fff}
      .plus{background:#1c9c56}.minus{background:#b3121f}
      .log{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(255,248,231,.08);border:1px solid rgba(255,214,120,.3);font-size:13px;line-height:1.5}
      .log b{color:#ffd878;font-family:${FONT_X};font-size:17px}
      .why{display:none;margin-top:10px}.parent .why{display:block}
      input{box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,214,120,.5);background:rgba(0,0,0,.35);color:#fff;font-size:14px;min-width:0}
      .why input{width:100%}
      .pm{display:none;font-size:12px;color:#ffd878;margin-top:4px}.parent .pm{display:block}
      .hint{font-size:11px;opacity:.45;text-align:right;margin-top:6px}
      .empty{padding:14px 4px;opacity:.8}
      .addk{display:none;margin:4px 0 6px;width:100%;background:#1c9c56;border:1.5px solid rgba(255,214,120,.6);font-size:16px;padding:10px}.showadd .addk{display:block}
      .parent.editing .addk{display:none}
      .err{display:none;font-size:12px;color:#ffb3b8;margin:6px 0;line-height:1.4}.err.on{display:block} .err button{margin-left:8px;background:#38446e;font-size:12px;padding:4px 10px;min-height:0}
      .tools{display:none;gap:8px;margin-top:12px}.parent .tools{display:grid;grid-template-columns:1fr 1fr}
      .tools button{background:#5a2a86;border:1px solid rgba(255,214,120,.5)} .tools .ed{background:#1f5e8c}
      .edit{display:none;margin-top:10px;padding:10px;border-radius:14px;background:rgba(0,0,0,.25);border:1px dashed rgba(255,214,120,.45)}
      .parent .edit.on{display:block} .parent.editing #kids,.parent.editing .why{display:none}
      .er{display:grid;grid-template-columns:62px 1fr 64px auto auto;gap:6px;align-items:center;margin:6px 0}
      .er.new{grid-template-columns:62px 1fr 64px auto;margin-top:12px;padding-top:10px;border-top:1px dashed rgba(255,214,120,.3)}
      .er .em{text-align:center;font-size:20px} .eh{display:grid;grid-template-columns:62px 1fr 64px 96px;gap:6px;font-size:11px;opacity:.7}
      .sv{background:#1c9c56}.dl{background:#b3121f}.ad{background:#1c9c56}
      .dlg{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(5,11,31,.82)}
      .dlg.on{display:flex}
      .dlg>div{max-width:min(86vw,520px);padding:18px;border-radius:16px;background:#1a2550;border:2px solid #ffd878;text-align:center;font-size:16px;line-height:1.45;box-shadow:0 10px 30px rgba(0,0,0,.6)}
      .dlg p{margin:0 0 14px} .dlg button{margin:4px}.dlg .yes{background:#b3121f}.dlg .no{background:#38446e}
      :host(.tab) .hd{font-size:clamp(16px,1.75vw,22px);padding:14px 16px 4px;gap:8px} :host(.tab) .hd small{font-size:clamp(10px,1vw,12px);text-align:right;line-height:1.2}
      :host(.tab) .nm{font-size:clamp(17px,1.8vw,21px)} :host(.tab) .nm span{font-size:clamp(13px,1.3vw,15px)}
      :host(.tab) .av{width:56px;height:56px;font-size:32px} :host(.tab) .kid{grid-template-columns:56px 1fr;gap:12px;padding:11px 0}
      :host(.tab) .bar{height:22px} :host(.tab) .star{font-size:21px;top:-2px}
      :host(.tab) button{font-size:18px;min-height:52px;min-width:56px;padding:10px 14px;border-radius:14px}
      :host(.tab) input{font-size:18px;padding:12px;min-height:52px} :host(.tab) .er .em{font-size:26px}
      :host(.tab) .er{grid-template-columns:70px 1fr 76px auto auto} :host(.tab) .er.new{grid-template-columns:70px 1fr 76px auto} :host(.tab) .eh{grid-template-columns:70px 1fr 76px 118px;font-size:13px}
      :host(.tab) .dlg>div{font-size:20px} :host(.tab) .log{font-size:clamp(12.5px,1.25vw,15px);line-height:1.45} :host(.tab) .err{font-size:14px} :host(.tab) .err button{font-size:14px;min-height:0;padding:6px 12px}
      `);
      r.innerHTML+=`<ha-card class="np"><div class="hd" id="hd">${this._c.title?esc(this._c.title):t.nice_title}<small>${t.nice_sub}</small></div><div class="bd" id="bd">
        <div class="pm">${t.parent}</div>
        <div class="why"><input id="why" maxlength="60" placeholder="${t.why}"></div>
        <div class="tools"><button class="ed" id="ed">${t.edit}</button><button id="rst">${t.reset}</button></div>
        <div class="edit" id="edit"></div>
        <div id="kids"></div>
        <div class="err" id="err"></div>
        <button class="addk" id="addk">${t.add_kid}</button>
        <div class="log"><b>${t.log_title}</b><div id="log"></div></div><div class="hint">${t.hold}</div></div>
        <div class="dlg" id="dlg"><div><p id="dq"></p><button class="yes" id="yes"></button><button class="no" id="no">${t.cancel}</button></div></div></ha-card>`;
      const $=id=>r.getElementById(id);
      longPress($("hd"), 900, ()=>this._toggleParent()); keyAct($("hd"), String(t.parent||"").replace(/<[^>]*>/g,""), ()=>this._toggleParent());
      $("kids").addEventListener("click",e=>{ const b=e.target.closest("button[data-d]"); if(!b) return; const row=b.closest(".kid");
        const k=this._kids().find(x=>x.uid===row.dataset.uid); if(!k) return; const why=$("why"); const d=+b.dataset.d; const w=(why.value||"").trim();
        const ns=clamp100(k.score+d); this._setScore(k,ns); this._log(`${k.name} ${d>0?"+":""}${d}${w?": "+w:""}`); why.value=""; this._armTimer(); });
      $("ed").addEventListener("click",()=>{ this._edit=!this._edit; $("edit").classList.toggle("on",this._edit); $("bd").classList.toggle("editing",this._edit); $("ed").textContent=this._edit?this._tr.edit_done:this._tr.edit; this._renderEdit(true); this._armTimer(); });
      $("rst").addEventListener("click",()=>{ this._confirm(`<b>${t.reset_q}</b><br>${t.reset_txt}`, this._tr.yes_reset, async ()=>{
        for(const k of this._kids()) await this._setScore(k,k.start); this._log(this._tr.new_start, true); }); });
      $("no").addEventListener("click",()=>$("dlg").classList.remove("on"));
      $("yes").addEventListener("click",()=>{ $("dlg").classList.remove("on"); const f=this._onYes; this._onYes=null; f&&f(); this._armTimer(); });
      $("edit").addEventListener("click",e=>this._editClick(e));
      $("addk").addEventListener("click",()=>this._openEdit());
      $("err").addEventListener("click",e=>{ if(e.target.closest("button")) this._retry(); });
      this._built=true;
    }
    const kidsEl=r.getElementById("kids"), bd=r.getElementById("bd"), errEl=r.getElementById("err");
    if(!this._store()){ kidsEl.innerHTML=`<div class="empty">${t.no_store}</div>`; bd.classList.remove("showadd"); errEl.classList.remove("on"); this._renderLog(); return; }
    errEl.classList.toggle("on", !!this._err); errEl.innerHTML = this._err ? `⚠ ${esc(this._err)}<button>${t.retry}</button>` : "";
    const kids=this._kids();
    // The add button is always reachable when there is nothing to show (empty list, still loading too long, or an error).
    bd.classList.toggle("showadd", !kids.length && (!!this._items || !!this._err));
    kidsEl.innerHTML = !this._items ? (this._err ? "" : `<div class="empty">${t.loading}</div>`) : !kids.length ? `<div class="empty">${t.no_kids}</div>` : kids.map(k=>{ const [txt,col]=this._level(k.score);
      return `<div class="kid" data-uid="${esc(k.uid)}"><div class="av">${this._av(k.emoji)}</div><div>
        <div class="nm">${esc(k.name)}<span style="color:${col}">${txt}</span></div>
        <div class="bar"><div class="fill" style="width:${k.score}%;--bw:${k.score>0?10000/k.score:100}%"></div><div class="star" style="left:${Math.max(4,Math.min(96,k.score))}%">⭐</div></div>
        <div class="pb"><button class="plus" data-d="5">+5 ⭐</button><button class="plus" data-d="1">+1</button><button class="minus" data-d="-1">−1</button><button class="minus" data-d="-5">−5 🪨</button></div>
      </div></div>`; }).join("");
    this._renderEdit(!!this._pendingEdit); this._pendingEdit=false; this._renderLog();
  }
  _openEdit(){ const r=this.shadowRoot; if(!this._parent) this._toggleParent(); this._edit=true;
    r.getElementById("edit").classList.add("on"); r.getElementById("bd").classList.add("editing"); r.getElementById("ed").textContent=this._tr.edit_done; this._renderEdit(true); this._armTimer();
    const n=r.querySelector(".er.new .nmI"); if(n) try{ n.focus(); }catch(e){} }
  _renderLog(){ const el=this.shadowRoot&&this.shadowRoot.getElementById("log"); if(!el) return; const L=this._logLines().slice(0,this._c.log_lines);
    el.innerHTML=(L.length?L:[this._tr.no_log]).map(l=>`✏️ ${esc(l)}`).join("<br>"); }
  _renderEdit(force){ const el=this.shadowRoot.getElementById("edit"); if(!el||!this._edit) return;
    if(!force && el.contains(this.shadowRoot.activeElement)) return; const t=this._t;
    el.innerHTML=`<div class="eh"><span>${t.e_emoji}</span><span>${t.e_name}</span><span>${t.e_start}</span><span></span></div>`+
      this._kids().map(k=>`<div class="er" data-uid="${esc(k.uid)}"><input class="em" maxlength="120" value="${esc(k.emoji)}"><input class="nmI" maxlength="30" value="${esc(k.name)}">
        <input class="stI" type="number" min="0" max="100" step="5" value="${k.start}"><button class="sv">${t.save}</button><button class="dl">${t.del}</button></div>`).join("")+
      `<div class="er new"><input class="em" maxlength="120" value="🧒"><input class="nmI" maxlength="30" placeholder="${t.new_name}">
        <input class="stI" type="number" min="0" max="100" step="5" value="${clamp100(this._c.default_start)}"><button class="ad">${t.add}</button></div>`; }
  _editClick(e){ const b=e.target.closest("button"); if(!b) return; const row=b.closest(".er"); const t=this._t; this._armTimer();
    const em=row.querySelector(".em").value.trim()||"🧒", nm=row.querySelector(".nmI").value.trim(), st=clamp100(row.querySelector(".stI").value);
    if(b.classList.contains("ad")){ if(!nm){ const n=row.querySelector(".nmI"); n&&n.focus(); return; } this._pendingEdit=true;
      this._svc("add_item",{item:nm, description:JSON.stringify({emoji:em, score:st, start:st})})
        .catch(err=>this._fail(String((err&&err.message)||err))); return; }
    const k=this._kids().find(x=>x.uid===row.dataset.uid); if(!k) return;
    if(b.classList.contains("sv")){ const d=Object.assign({},k.d,{emoji:em, start:st, score:k.score}); const data={item:k.uid, description:JSON.stringify(d)}; if(nm && nm!==k.name) data.rename=nm;
      this._svc("update_item",data); b.textContent="✔"; setTimeout(()=>this._renderEdit(true),600); }
    if(b.classList.contains("dl")) this._confirm(`<b>${F(t.del_q,{name:esc(k.name)})}</b><br>${F(t.del_txt,{name:esc(k.name)})}`, this._tr.yes_del, ()=>this._svc("remove_item",{item:[k.uid]}).then(()=>setTimeout(()=>this._renderEdit(true),300)));
  }
  _confirm(html, yes, fn){ const r=this.shadowRoot; r.getElementById("dq").innerHTML=html; r.getElementById("yes").textContent=yes; this._onYes=fn; r.getElementById("dlg").classList.add("on"); this._armTimer(); }
  _closeParent(){ const r=this.shadowRoot; this._parent=false; this._edit=false; r.getElementById("bd").classList.remove("parent"); r.getElementById("dlg").classList.remove("on");
    r.getElementById("edit").classList.remove("on"); r.getElementById("bd").classList.remove("editing"); r.getElementById("ed").textContent=this._tr.edit; }
  _armTimer(){ clearTimeout(this._pt); this._pt=setTimeout(()=>this._closeParent(),120000); }
  _toggleParent(){ if(this._parent){ this._closeParent(); return; } this._parent=true; this.shadowRoot.getElementById("bd").classList.add("parent"); this._armTimer(); if(navigator.vibrate) navigator.vibrate(40); }
}

/* ---------- ELF OF THE DAY ---------- */
class NordpolElf extends HTMLElement {
  static getStubConfig(){ return {}; }
  static getConfigForm(){
    return {
      schema:[
        {type:"grid", schema:[
          {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
          {name:"title", selector:{text:{}}}
        ]},
        {type:"grid", schema:[
          {name:"date", selector:{text:{}}},
          {name:"time_zone", selector:{text:{}}}
        ]},
        {name:"entity", selector:{entity:{}}}
      ],
      assertConfig(c){ assertObj(c); },
      computeLabel: mkLabel(),
      computeHelper: mkHelper()
    };
  }
  setConfig(c){ this._t=T(c); this._tr=TRaw(c); this._c=Object.assign({title:this._tr.elf_title, entity:null},c||{}); this._last=null; if(this._hass) this.hass=this._hass; else if(!this._c.entity) this._render(this._builtin()); }
  _now(){ return nowInTz(this._c.time_zone||(this._hass&&this._hass.config&&this._hass.config.time_zone)); }
  _list(){ const u=this._c&&this._c.elves; return (u&&u.length)?u.map(e=>Array.isArray(e)?e:[e.name,e.joke,e.task]):this._tr.elves; }
  /* advent day = days until the celebration date counted back from 24 (24 on the day itself, so Dec 1 = 1 with the default date) */
  _adv(n){ const [mo,d]=dateMD(this._c); const t=new Date(eventYear(n,this._c),mo,d); const today=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    return 24-Math.round((t-today)/86400000); }
  _builtin(){ const E=this._list(), n=this._now(), a=this._adv(n);
    const i=(a>=1&&a<=30)?(a-1)%E.length:(n.getFullYear()*372+n.getMonth()*31+n.getDate())%E.length; return E[i].join("|"); }
  set hass(h){ const first=!this._hass; this._hass=h; const st=this._c.entity&&h.states[this._c.entity]; const s=st&&!["unknown","unavailable",""].includes(st.state)?st.state:this._builtin(); if(first||s!==this._last){this._last=s; this._render(s);} }
  getCardSize(){ return 4; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  _render(s){
    const r=this.shadowRoot||this.attachShadow({mode:"open"}); r.innerHTML=""; 
    css(r, BASE_CSS+`
      .scroll{position:relative;margin-top:4px;padding:16px 16px 14px;border-radius:14px;color:#3b2207;
        background:linear-gradient(180deg,#fff3d1,#f3dba4);box-shadow:inset 0 0 22px rgba(140,90,20,.35),0 6px 16px rgba(0,0,0,.4)}
      .who{display:flex;align-items:center;gap:12px}
      .elf{font-size:46px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3));animation:wb 2.4s ease-in-out infinite}
      @keyframes wb{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
      .n{font-family:${FONT_X};font-size:28px;font-weight:700;color:#9c1020}
      .dt{font-size:12px;opacity:.7}
      .j{margin-top:10px;font-size:15px;line-height:1.45}
      .j b{color:#9c1020}
      .ans{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:6px;background:#3b2207;color:#3b2207;cursor:pointer;transition:all .3s}
      .ans.show{background:transparent;color:#1d6b3c;font-weight:700}
      .task{margin-top:12px;padding:10px 12px;border-radius:10px;background:#1c7a45;color:#fff;font-weight:700;display:flex;gap:8px;align-items:center}
      .task.done{background:#b8860b}
      :host(.tab) .hd{display:none}
      :host(.tab) .n{font-size:clamp(22px,2.3vw,32px);line-height:1.1;overflow-wrap:break-word} :host(.tab) .elf{font-size:clamp(44px,4.5vw,58px)} :host(.tab) .j{font-size:clamp(15px,1.55vw,19px);line-height:1.4}
      :host(.tab) .task{font-size:clamp(14px,1.45vw,18px);padding:12px 14px;min-height:48px;line-height:1.35} :host(.tab) .ans{padding:5px 10px}
    `);
    const L=this._t; const [name,joke,task]=(s||this._builtin()).split("|");
    let q=joke||"", a=""; const k=q.indexOf("?"); if(k>0){a=q.slice(k+1).trim(); q=q.slice(0,k+1);}
    const n=this._now(); const adv=this._adv(n);
    /* one label format for every December day (elf_date), the locale's own format for other months (e.g. date: 01-07) */
    const dd=(adv>=1&&adv<=30)?(n.getMonth()===11?F(L.elf_date,{d:n.getDate()}):n.toLocaleDateString(this._tr.locale,{day:"numeric",month:"long"})):L.elf_trial;
    const key="nordpol-task-"+n.toDateString();
    const done=localStorage.getItem(key)==="1";
    r.innerHTML+=`<ha-card class="np"><div class="hd">${esc(this._c.title)}<small>${dd}</small></div><div class="bd"><div class="scroll">
      <div class="who"><div class="elf">🧝</div><div><div class="n">${esc(name)}</div><div class="dt">${L.elf_duty}</div></div></div>
      ${q?`<div class="j"><b>${L.elf_joke}</b><br>${esc(q)}<br><span class="ans" id="ans">${esc(a||"…")}</span> <small style="opacity:.6">${L.elf_tap}</small></div>`:""}
      ${task?`<div class="task ${done?"done":""}" id="task">${done?"✅":"🎯"} <span>${L.elf_task} ${esc(task)}</span></div>`:""}
    </div></div></ha-card>`;
    const an=r.getElementById("ans"); an&&an.addEventListener("click",()=>an.classList.add("show")); keyAct(an, L.elf_tap, ()=>an.classList.add("show"));
    const t=r.getElementById("task"); const tog=()=>{ const d=localStorage.getItem(key)==="1"; localStorage.setItem(key,d?"0":"1"); this._render(s); const nt=r.getElementById("task"); nt&&nt.focus(); };
    t&&t.addEventListener("click",tog); if(t){ keyAct(t, null, tog); t.setAttribute("aria-pressed", done?"true":"false"); }
  }
}

/* ---------- SLEIGH TRACKER ----------
   Santa flies WEST along local midnight. Each stop: [da, en, lat, lon, UTC offset in December, local arrival ("+" = next day)].
   The home city (config `home`) is inserted at its local `eta` (default 23:59) and the route is sorted by UTC time. */
/* Simplified world land outline (Natural Earth 110m, public domain), equirectangular: x = lon+180, y = 90-lat. */
const LAND = "M120.4,170L119.8,171L114.3,170.5L120.4,170ZM134.8,168L136.7,170L129.5,171L126,170.2L131.3,168L134.8,168ZM81,161.9L83.8,162.5L79.2,162.5L77.7,161.9L81,161.9ZM111.5,161L111.2,162.2L108.9,162.5L105,162.1L106.1,161.3L107.9,161.2L108.3,159.5L109.7,158.9L111.5,161ZM121.4,154.2L118,154.8L117.9,156.2L114.3,158L118.2,160.7L119.2,163.7L109.4,166.6L102.8,166.7L106.3,167.9L102.1,168.4L102,169.2L121.8,173.2L151.5,170.3L150.3,169.3L144.4,169.5L144.7,168.1L162.5,165.1L164.3,164.5L163.5,163.9L164.6,163.1L173.1,160.9L179.8,161.6L187.7,159.9L190.8,160.8L193.4,160L207.1,160.5L213.9,158.5L218.6,159.8L234.5,155.8L241.4,158L248.9,157.9L249.7,159.2L247.8,160.3L249.1,160.7L247.9,161.9L249.9,162.3L253.9,159.9L268,156.2L269.7,157.2L279.7,157.2L282.8,155.6L286.2,156.9L293.6,155.9L297.4,156.9L312.9,156.4L315.1,155.3L317.5,157L325.5,156.9L328.8,158.4L350.5,161.4L351.1,162.1L349.3,163.7L343.6,166.2L344.7,168.2L347,168.8L341.8,169.2L339.8,170.9L349.4,173.8L360,174.7L360,180L0,180L0,174.7L0.9,174.1L10,173.9L21.9,175.4L36.9,175L26.4,173.7L27.1,172L23.2,171.1L33.6,170.3L24.7,169.1L21.9,168L21.6,166.9L28.7,167.4L33.9,166.5L33.8,165.4L35.1,165.2L66.1,163.7L67.7,164.7L79.4,165.3L76.3,162.6L105.1,163.9L112.6,162.5L111.5,159.7L112.3,157.3L117,154.6L122.2,153.3L121.4,154.2ZM112.2,143.8L115,144.7L111.9,145.6L106.7,144L105.3,142.8L108.9,144.1L110.7,142.5L112.2,143.8ZM121.5,141.1L122,141.9L119.3,142.3L121.5,141.1ZM325.4,130.8L328.3,130.9L327.6,132.9L326,133.5L324.7,131.2L325.4,130.8ZM353,130.9L354.2,131.3L353.1,133.9L348.4,136.6L346.7,136.2L347,135.1L353,130.9ZM354.6,126.2L356.8,127.9L358.5,127.7L355.1,131.4L353.8,129.5L354.7,127.4L352.6,124.5L354.6,126.2ZM230.1,103.6L230.4,105.7L227.1,114.9L224,115L223.4,111.3L224.4,106.2L227.7,104.6L229.2,102L230.1,103.6ZM323.6,103.8L325.4,105L326.4,109L328.8,110.4L333.1,116.1L332.9,121.6L329.4,127.8L326.3,129L325,127.9L323.6,128.8L320.6,128L318.1,125.6L318.2,124.4L316.8,125.3L317.8,122.9L316,124.9L314.3,122.6L311.3,121.5L296.6,125L295,124.2L295.8,122.2L294.6,118.5L293.3,116.1L294.2,116.3L293.4,114.4L294.1,111.8L294.2,112.5L300.9,109.7L305.7,104.2L309.6,105L310.6,102.5L312.6,102.1L312.4,101.1L316.5,101.9L315.5,105L320.2,107.7L322.1,101L323.6,103.8ZM304.4,100.1L303.5,100.2L304,99.3L305.9,98.4L307.3,98.4L304.4,100.1ZM288.6,96.8L290.8,96.5L295.7,98.4L290.6,98.1L285.4,96.9L286.1,95.9L288.6,96.8ZM332,95.5L329.7,96.3L328.3,95.7L330,95L330.8,95.5L332.1,94.1L332,95.5ZM314.1,91.2L315.5,93.4L318.3,91.7L324.6,93.9L330.8,100.3L327.9,100.1L324.7,97.6L322.6,99.3L317.6,98.4L318.7,97.3L317.9,95.4L313.7,93.5L313,94.1L312,92.8L313.7,92.2L310.5,90.9L314.1,91.2ZM305.2,88.6L303.7,89.8L300.2,89.8L300.9,91.4L303.3,90.6L301.5,91.9L303.2,95.3L301.5,94.6L301,92.6L300.4,95.5L299.4,95.4L298.8,92.8L300,89.4L305.2,88.6ZM308.7,88.9L308.4,90.8L307.7,90.3L307.6,88.2L308.7,88.9ZM285.8,95.9L282.6,94.2L275.4,85L277.5,84.8L283.8,89.9L283.4,90.7L286.1,93.1L285.8,95.9ZM297.9,88.2L299,89.1L297.8,89.2L296.1,94L294.9,94.1L290.2,92.9L289,89.6L289.7,88L290.4,88.3L296.7,83.1L299.2,84.6L297.3,86.8L297.9,88.2ZM306.4,81.6L305.4,84.4L303.6,82.2L302.8,82.5L302.1,83.1L302.3,82L305.5,81L305.4,80.2L306.4,81.6ZM261.2,83.8L259.9,83.2L260.1,80.2L260.8,80.7L261.8,82.5L261.2,83.8ZM301.3,71.5L302.5,72.9L301.7,75.7L304,76.2L304.1,77.5L303.3,77L300.1,75L301.3,71.5ZM107.4,70.1L111.7,71.4L109,71.7L105.5,71.7L107.7,71.3L106.6,70.4L107.4,70.1ZM290.3,71.3L288.7,71.5L290.2,69.9L291,70.3L290.3,71.3ZM100.3,67.2L105.8,69.7L102.2,70.1L102.9,69.6L100.7,68.4L98.2,67.4L95,68.1L97.7,66.8L100.3,67.2ZM301.2,67.2L300.7,68L300.2,67.2L300.7,65.5L302,65L301.2,67.2ZM195.5,51.8L195.1,53.4L193.8,52.9L192.6,51.9L195.5,51.8ZM189.2,48.8L189.7,50.8L188.4,50.8L188.2,49L189.2,48.8ZM321,52.9L320.3,54.9L315.8,56.5L315.1,55.4L311,56.1L312,56.9L310.7,59L309.4,56.7L312.6,54.6L315.7,54.5L316.7,52.7L319.4,51.8L320.3,48.8L321.4,48.6L321.9,50L321,52.9ZM323.9,45.8L325.3,45.6L325.5,46.7L320,48.4L322,44.4L323.9,45.8ZM123.9,39.3L123.2,40.2L126.9,41.3L126.9,43.3L125.8,42.2L124.6,43.1L120.7,42.4L122.6,39.3L124.1,38.4L123.9,39.3ZM323.6,39.3L324.7,41L323.2,40.7L322.6,42.1L323.5,43.9L322.1,44L322.1,40.4L322.2,35.8L323.6,39.3ZM173.2,37.7L170,38.2L170.3,36.1L172.4,34.9L174.3,35.4L173.2,37.7ZM177,31.4L175.9,32.4L178,32.3L176.9,34L181.7,37.3L181.4,38.7L174.2,39.8L176.6,38.6L174.7,38L177.1,36L174.4,34.7L173.9,33.2L175,31.4L177,31.4ZM94.8,24.3L99.9,26.3L97.5,26.3L92.8,26.5L94.8,24.3ZM165.5,23.5L166.4,24.9L161.3,26.5L157.2,26L158.2,25.6L156,25.1L157.8,24.9L155.7,24.4L156.3,23.7L165.5,23.5ZM5,23.4L10.1,24L7.5,24.6L7,25.7L3.8,24.6L1.3,23.9L0,25L0,21L5,23.4ZM89.5,20.5L89.4,21.5L90.8,20.7L92.6,22.8L94.5,20.1L97.4,20.3L98.7,20.8L98.7,22.4L94.2,23.4L92.7,25.2L86.8,28L85.3,31.1L86.8,31.2L87.7,32.9L97.7,34.9L97.9,36.7L100.1,38.8L101.4,37.4L100.2,35.3L103.5,33.5L101.5,31.2L102.7,30.1L101.9,27.7L106.2,27.6L110.4,28.9L110.7,31L112.4,31.8L115.4,29.7L118.2,33.7L122.7,35.4L124.3,37.9L120,39.8L113.6,39.8L108.9,43.2L114.9,40.8L115.8,41.3L114.9,41.9L115.5,43.8L118.5,44.1L119.5,43L120.2,44.1L114.6,46.5L113.8,45.5L115.6,44.7L112.9,44.9L109.3,47L110,48.4L106.3,49.1L108.1,49.1L106,49.2L105.1,51.1L104.5,50.5L104.1,52.8L103.7,50.8L103,51.8L104.3,54.4L98.7,58.6L99.6,64.8L95.9,59.9L90.8,59.7L89.8,60.9L86.2,60.3L83.4,61.7L82.1,67.6L83.7,70.7L85.6,71.9L88,71.3L89.7,69L92.9,68.5L91.1,74.1L96.6,74.7L96.2,78.9L98.6,81.2L100.4,80.4L103.2,81.4L105.1,78.9L108.2,77.6L108.3,80.9L110.1,77.8L111.8,79.4L118.1,79.3L117.6,80.1L122.9,84L126,84.2L128.7,85.8L130,88.3L129.6,90.1L135.1,91.6L135.4,92.7L140,92.9L144.4,95.1L145.3,97.3L141.3,103.1L139.1,111.9L132.4,114.9L131.1,118.7L126.2,124.4L123.8,124.9L121.6,123.9L123.2,126.9L120.8,128.7L117.7,128.8L117.3,131L114.9,131.1L116.5,132.6L112.7,135.6L112.4,136.3L114.4,137.2L110.9,140.7L111.8,142.3L108.6,143.9L104.7,141.6L104.4,138.7L105.9,136.9L104.4,136.6L105.6,134.1L106.8,134.5L107.3,132.4L105.7,133.2L106.4,127.2L108.6,122.4L109.8,109.8L108.5,107.4L104,104.6L100.2,97.2L98.8,96.1L100.2,92.7L99,92.2L99.1,91.1L102.9,86.2L101.8,81.7L100.4,81.1L99.1,82.8L94.3,80.1L92.5,76.7L76.5,71.7L74.5,70.1L74,67.2L66.1,58.4L65.2,58.2L65.3,59.8L70.6,66.6L70,67.2L67.8,65.3L67.7,64L64.9,62.3L65.8,61.4L62.7,57L59.4,55.4L55.6,49.7L55.3,41.8L57.4,42.9L57.2,41L52.6,39.2L52.1,37.7L45.9,31.9L32.9,29.1L28.3,30.8L29.4,28.7L21.6,34L15.2,35.6L22.3,32.4L23,31.1L18,31.3L18.1,30.4L13.9,28.5L15.4,26.9L19.2,26.2L18.5,25.6L19.2,25.2L15,25.6L11.9,24.3L18.3,23.9L13.2,21.6L23.4,18.6L43.5,21.1L51.9,19.5L71.1,22.6L72.2,22.1L71.2,21.7L71.8,21.3L73.8,21.2L78.5,22.4L82.3,21.4L83.9,21.8L83.9,22.7L85.8,20.9L83.5,19.9L84.8,18.1L89.5,20.5ZM65.8,16.9L70.1,17L71.8,18.3L71.6,16.9L74.6,17.3L75.5,19L78.9,20.4L77.3,20.5L77.6,21.2L72.9,20.9L63.9,20.8L62.7,20L67.6,19.6L62.1,19.5L63.9,18.7L60.6,18.4L65.8,16.9ZM103.7,16.9L100.2,17.2L99.6,16.2L103.7,16.9ZM93.4,16.8L94.2,17.5L97.7,16.2L99.3,17.9L102.2,17.3L107.8,18.4L112.1,19.9L113,20.8L111.2,21.3L118.1,23.1L116.1,25L112,23.7L115.3,26.6L115,27.3L111.2,26.3L113.8,28.1L105.2,25.3L101.4,25.4L106,24.5L107.1,22.3L101,19.8L91.3,19.6L89.8,17.8L91.6,16.5L94.2,16.2L93.4,16.8ZM79.6,16.2L82.9,16.5L81.9,17L83.5,17.4L83.3,18.3L81.6,18.7L77.5,17.5L79.6,17.3L78.5,16.6L79.6,16.2ZM86.8,17.2L84.6,17.9L84.5,16.1L89.5,16.1L86.8,17.2ZM59.5,18.6L56.9,19.1L54.1,18.1L56.1,16.3L55.1,15.7L58.5,15.6L64.5,16.5L59.5,18.6ZM325.1,14.4L319,15.4L317,14.7L318.8,13.9L325.1,14.4ZM81.5,13.3L81.8,15L79.1,14.4L77.4,13.7L81.5,13.3ZM71.8,13.8L74.1,14L73.7,15L63.7,15L62.3,14.8L64.6,13.5L70.9,14.5L69.5,13.6L71.8,13.8ZM237.5,19.3L233.7,19.2L231.5,18L235.6,14.9L241.2,13.7L248.9,13.5L238.5,15.7L235.4,17.6L237.5,19.3ZM85.3,12.9L90.8,14.4L98.9,14.3L99.9,14.7L99.5,15.3L87.6,15.2L86.1,13.7L82.9,13.2L85.3,12.9ZM63.8,12.4L62.9,13.5L57.1,13.9L63.8,12.4ZM287,13L294.1,14.2L289.4,15.8L303.2,17L303.3,16.3L307,16.4L311.3,19.2L312.3,18.2L319.9,18.5L319.1,17.6L320.5,17.2L339,19.1L340.9,20.6L347.8,20.4L349.6,21.3L350.8,21L350.5,19.9L358.6,20.6L360,21L360,25L357.4,25.4L359.5,27.4L353.7,28.3L350.3,30.1L343.5,30.1L342,31.8L343.2,32.4L342.1,35.1L336.8,39L335.9,33.2L343.7,28.9L344.5,27.4L340.1,29.5L339.3,28.2L336.7,28.6L334.2,30.2L335,30.9L322.2,31L315.1,35.3L319.9,35.8L321.4,37.8L318.2,43.7L314.9,46.6L312.3,46.7L307.5,50.2L309.5,53.2L309.1,54.9L306.5,55.6L306.1,53.3L306.9,53.1L304.7,51.9L305.3,50.4L301.1,51.1L301.6,49.1L298,50.8L298.9,52.6L302.4,52.5L299.2,55.1L301.9,58.3L301.7,61.8L295.9,67.2L290.8,68.6L290.4,69.7L288.5,68.3L285.9,70.2L289.3,76.6L289.2,78.3L285.2,81.4L285.1,80.1L280.1,76.6L279.2,80.8L283,84.5L284.2,88.7L281.4,87.2L280.1,83.5L278.3,82.2L278.8,78.6L277.2,73.1L274.2,74L274.3,71.8L271.4,67.2L267,68.5L266.5,69.8L260.3,74.1L259.9,79.6L257.5,82L253.5,74L252.6,68.6L250.5,69.1L246.4,64.6L237.4,64.3L236.5,62.9L234.7,63.5L231.5,62.1L230.1,59.9L228,60L230.8,65.2L231.6,64.2L231.8,66L234,65.9L236.4,63.6L236.8,65.8L239.8,67.7L235.3,72.8L223.5,77.4L222.6,73.2L214.6,61.9L214.9,60.5L213.9,62.4L212.4,60.1L216.9,68L217.5,71.4L223.3,77.6L222.7,78.3L224.6,79.6L231.1,78L230.6,80.8L226.6,87.1L220.3,92.6L218.7,95.9L220.8,104.7L214.8,109.8L215.5,114.1L212.6,115.7L212.2,118.8L208.2,122.8L200.1,124.8L198.4,124.1L193.9,111.7L191.6,106.7L193.7,100.7L191.9,95L188.8,91.1L189.4,86.3L188.5,85.2L185.9,85.7L184.3,83.7L178,85.3L171,85.2L163.4,77.8L162.4,75.3L163.9,71.9L163,68.1L165.6,63.7L170.4,60.1L170.7,57.4L174.1,54.2L177.8,54.8L181.5,53.4L189.5,52.6L191.1,53.1L190.3,56.2L199.1,59.7L201.5,57.2L208.9,59.1L213.8,59L216.2,53.3L207.6,53.3L206.2,50.5L213.5,48L218.3,49.1L221.7,48L216.7,44.8L219.1,42.7L215,43.7L216.3,44.9L213.9,45.6L212.5,44.7L213.3,43.9L210.7,43.4L207.7,47.4L208.8,48.9L202.6,49.7L204,52.3L203.1,52.1L202.5,53.6L199.4,49.7L199.5,48.3L193.1,44.3L192.6,45.9L198.5,49.8L196.9,49.6L196.1,52L195.4,50L188.9,45.6L183.1,46.9L183,48.1L180.8,49L180.1,51.3L177.9,53.3L174.6,54.1L171.1,53.1L170.6,47L178.6,46L178.8,44L175.4,41.3L178.4,41.4L178.1,40.2L181.3,39.9L184.7,36.9L188.1,36.5L188.5,32.9L190.6,32.3L190.9,33.5L189.7,34.5L190.9,36L199.7,35.6L201.3,34.8L201.6,32.6L204.1,33L204.4,31.6L203.3,30.8L209.1,30L202.9,30.2L201.3,29.3L201.5,26.8L205.4,24.9L202.2,24.3L197.8,27.3L197.1,28.7L198.8,29.9L196.8,31.3L195.9,33.9L192.9,34.6L190.4,30.5L188.4,31.7L185.7,31.4L185,28L194.8,22.2L204.5,19L208.2,18.8L211.3,19.5L210,19.8L211.1,20.4L220.3,22.1L221.1,23.2L220,23.7L213.2,23.4L214.8,24.1L214.9,25.6L217,26.2L217.2,24.9L219.6,25.5L222.1,23.5L223.9,23.9L224.5,23.2L223.5,21.4L226.3,21.7L226.8,22.3L225.6,23L226.3,23.3L233.7,21.1L239.9,21.7L241.1,21.1L240.6,20.1L248.5,21.9L249.2,21.4L246.9,20.5L246.7,19L249.2,17.2L252.6,17.2L251.8,18.6L253.7,21.6L251.3,23.7L252.4,23.8L255.1,22.2L253.6,20.4L254.4,19.4L253.1,18.6L254.7,17.2L256.4,18.8L255.9,18.1L257.6,17.7L261.5,18.2L260.5,16.4L266.8,16.1L266,15.5L267.2,14.9L280.8,13.6L284.4,12.3L287,13ZM285.1,11.7L279.4,12.1L282.1,10.7L285.1,11.7ZM198.3,10.3L201.5,11L199,11.4L197.1,13.2L193.2,12L190.4,10.3L198.3,10.3ZM205.4,9.6L207.4,9.9L205.9,10.5L198.5,10.1L205.4,9.6ZM279.9,11.1L271.2,9.7L275.9,8.7L280.2,10.2L279.9,11.1ZM93,10.3L94.2,10.7L89.2,11.8L83.9,10.3L83.3,9.8L85.3,8.8L87.6,8.7L93,10.3ZM111.5,6.9L118.1,7.6L103.1,10.7L104.6,11.5L100.2,12.8L102.1,13.2L90.5,13.5L92.2,12.8L91.7,12.1L95,12.5L92,11.6L94.9,10.7L93.1,9.7L98.2,9.5L92.4,9.5L88.4,8.1L111.5,6.9ZM152.9,6.5L159.2,7.3L148.6,8L167.8,8.7L160,9.8L162.3,9.9L160.3,11.2L161.5,13L158.3,13.4L160.2,13.9L160.4,14.8L159.3,14.8L160.6,15.7L156.4,16.7L157.7,17.8L155.2,17.7L158.2,19.3L154.5,18.6L153.6,19.8L157.7,19.9L140.2,24.5L137.2,27.3L136.6,29.9L133.7,29.1L130.8,28.6L126.3,23.9L126,22.8L129.1,20.1L125.3,20.4L125.6,19.2L128.6,19.4L124.2,18.3L125.3,17.4L122.7,15.3L118.7,13.9L111.5,13.9L108.6,13L113.2,12.6L106.8,11.6L114.3,10.6L112,9.9L119.7,8L135.5,8.3L133.2,7.4L136.6,6.8L152.9,6.5Z";
const STOPS = [
 ["Fiji","Fiji",-18.1,178.4,12,"23:00"], ["New Zealand","New Zealand",-41.3,174.8,13,"00:30+"], ["Australien","Australia",-33.9,151.2,11,"23:30"],
 ["Japan","Japan",35.7,139.7,9,"23:30"], ["Kina","China",39.9,116.4,8,"23:30"], ["Indien","India",28.6,77.2,5.5,"23:30"],
 ["Dubai","Dubai",25.2,55.3,4,"23:30"], ["Kenya","Kenya",-1.3,36.8,3,"23:30"], ["Grækenland","Greece",38,23.7,2,"23:30"],
 ["Italien","Italy",41.9,12.5,1,"23:15"], ["Tyskland","Germany",52.5,13.4,1,"23:35"], ["England","England",51.5,-0.1,0,"23:50"],
 ["Island","Iceland",64.1,-21.9,0,"00:30+"], ["Brasilien","Brazil",-15.8,-47.9,-3,"23:50"], ["New York","New York",40.7,-74,-5,"23:50"],
 ["Mexico","Mexico",19.4,-99.1,-6,"23:50"], ["Hawaii","Hawaii",21.3,-157.8,-10,"23:50"]
];
const STOP_NAMES = {
 fr: {"New Zealand":"Nouvelle-Zélande","Australia":"Australie","Japan":"Japon","China":"Chine","India":"Inde","Dubai":"Dubaï","Greece":"Grèce","Italy":"Italie","Germany":"Allemagne","England":"Angleterre","Iceland":"Islande","Brazil":"Brésil","Mexico":"Mexique","Hawaii":"Hawaï","Fiji":"Fidji"},
 de: {"New Zealand":"Neuseeland","Australia":"Australien","Japan":"Japan","China":"China","India":"Indien","Dubai":"Dubai","Kenya":"Kenia","Greece":"Griechenland","Italy":"Italien","Germany":"Deutschland","England":"England","Iceland":"Island","Brazil":"Brasilien","Mexico":"Mexiko","Hawaii":"Hawaii","Fiji":"Fidschi"},
 es: {"New Zealand":"Nueva Zelanda","Australia":"Australia","Japan":"Japón","China":"China","India":"India","Dubai":"Dubái","Kenya":"Kenia","Greece":"Grecia","Italy":"Italia","Germany":"Alemania","England":"Inglaterra","Iceland":"Islandia","Brazil":"Brasil","Mexico":"México","Hawaii":"Hawái","Fiji":"Fiyi"},
 sv: {"New Zealand":"Nya Zeeland","Australia":"Australien","Japan":"Japan","China":"Kina","India":"Indien","Dubai":"Dubai","Kenya":"Kenya","Greece":"Grekland","Italy":"Italien","Germany":"Tyskland","England":"England","Iceland":"Island","Brazil":"Brasilien","Mexico":"Mexiko","Hawaii":"Hawaii","Fiji":"Fiji"},
 nb: {"New Zealand":"New Zealand","Australia":"Australia","Japan":"Japan","China":"Kina","India":"India","Dubai":"Dubai","Kenya":"Kenya","Greece":"Hellas","Italy":"Italia","Germany":"Tyskland","England":"England","Iceland":"Island","Brazil":"Brasil","Mexico":"Mexico","Hawaii":"Hawaii","Fiji":"Fiji"},
 nl: {"New Zealand":"Nieuw-Zeeland","Australia":"Australië","Japan":"Japan","China":"China","India":"India","Dubai":"Dubai","Kenya":"Kenia","Greece":"Griekenland","Italy":"Italië","Germany":"Duitsland","England":"Engeland","Iceland":"IJsland","Brazil":"Brazilië","Mexico":"Mexico","Hawaii":"Hawaï","Fiji":"Fiji"},
 fi: {"New Zealand":"Uusi-Seelanti","Australia":"Australia","Japan":"Japani","China":"Kiina","India":"Intia","Dubai":"Dubai","Kenya":"Kenia","Greece":"Kreikka","Italy":"Italia","Germany":"Saksa","England":"Englanti","Iceland":"Islanti","Brazil":"Brasilia","Mexico":"Meksiko","Hawaii":"Havaiji","Fiji":"Fidži"},
 pl: {"New Zealand":"Nowa Zelandia","Australia":"Australia","Japan":"Japonia","China":"Chiny","India":"Indie","Dubai":"Dubaj","Kenya":"Kenia","Greece":"Grecja","Italy":"Włochy","Germany":"Niemcy","England":"Anglia","Iceland":"Islandia","Brazil":"Brazylia","Mexico":"Meksyk","Hawaii":"Hawaje","Fiji":"Fidżi"},
 it: {"New Zealand":"Nuova Zelanda","Australia":"Australia","Japan":"Giappone","China":"Cina","India":"India","Dubai":"Dubai","Kenya":"Kenya","Greece":"Grecia","Italy":"Italia","Germany":"Germania","England":"Inghilterra","Iceland":"Islanda","Brazil":"Brasile","Mexico":"Messico","Hawaii":"Hawaii","Fiji":"Figi"},
 pt: {"New Zealand":"Nova Zelândia","Australia":"Austrália","Japan":"Japão","China":"China","India":"Índia","Dubai":"Dubai","Kenya":"Quénia","Greece":"Grécia","Italy":"Itália","Germany":"Alemanha","England":"Inglaterra","Iceland":"Islândia","Brazil":"Brasil","Mexico":"México","Hawaii":"Havai","Fiji":"Fiji"},
 cs: {"New Zealand":"Nový Zéland","Australia":"Austrálie","Japan":"Japonsko","China":"Čína","India":"Indie","Dubai":"Dubaj","Kenya":"Keňa","Greece":"Řecko","Italy":"Itálie","Germany":"Německo","England":"Anglie","Iceland":"Island","Brazil":"Brazílie","Mexico":"Mexiko","Hawaii":"Havaj","Fiji":"Fidži"}
};
const hm = s => { const plus=/\+$/.test(s); const [h,m]=String(s).replace("+","").split(":").map(Number); return h*60+(m||0)+(plus?1440:0); };
function tzOffsetH(tz, y, mo=11, dd=24){ if(!tz) return null; try{ const d=new Date(Date.UTC(y,mo,dd,12));
  const p=new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});
  return Math.round((Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)-d)/900000)/4; }catch(e){ return null; } }
class NordpolSleigh extends HTMLElement {
  static getStubConfig(){ return {eta:"23:59"}; }
  static getConfigForm(){
    return {
      schema:[
        {type:"grid", schema:[
          {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
          {name:"title", selector:{text:{}}}
        ]},
        {type:"grid", schema:[
          {name:"eta", default:"23:59", selector:{text:{}}},
          {name:"date", selector:{text:{}}}
        ]},
        {name:"time_zone", selector:{text:{}}}
      ],
      assertConfig(c){ assertObj(c); },
      computeLabel: mkLabel(),
      computeHelper: mkHelper()
    };
  }
  setConfig(c){ this._c=Object.assign({eta:"23:59"}, c||{}); this._t=T(this._c); this._tr=TRaw(this._c); this._demo=false; this._route=null; this._build(); }
  set hass(h){ const first=!this._hass; this._hass=h; if(first){ this._makeRoute(); this._drawBase(); this._tick(); } }
  getCardSize(){ return 6; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  _home(){ const c=this._c, hc=(this._hass&&this._hass.config)||{}; const h=typeof c.home==="object"&&c.home?c.home:{name:c.home};
    const y=eventYear(this._wall(new Date()),c), [dmo,dday]=dateMD(c); const lat=+(h.lat??h.latitude??c.latitude??hc.latitude??51.5), lon=+(h.lon??h.longitude??c.longitude??hc.longitude??0);
    let off=h.utc_offset??c.utc_offset; if(off==null) off=tzOffsetH(h.tz||h.time_zone||c.time_zone||hc.time_zone, y, dmo, dday); if(off==null) off=-new Date(Date.UTC(y,dmo,dday)).getTimezoneOffset()/60;
    return {name:h.name||hc.location_name||this._tr.sl_home, lat, lon, off:+off}; }
  _makeRoute(){ const H=this._home(), lg=langOf(this._c), t0=hm(this._c.eta||"23:59")-H.off*60; this._homeName=H.name; this._homeT=t0; this._homeOff=H.off;
    const extra=(this._c.extra_stops||[]).map(s=>[s.name,s.name,+s.lat,+s.lon,+s.utc_offset,s.local||"23:30"]);
    /* All stops are shifted by the same amount as your ETA (default 23:59), so Santa reaches every place at the same local clock time
      and the route stays east→west no matter what ETA/location is configured. */
    const sh=hm(this._c.eta||"23:59")-1439;
    let R=[...STOPS,...extra].map(s=>({name:lg==="da"?s[0]:((STOP_NAMES[lg]&&STOP_NAMES[lg][s[1]])||s[1]), lat:s[2], lon:s[3], t:hm(s[5])+sh-s[4]*60}))
      .filter(s=>Math.abs(s.t-t0)>=8 && Math.hypot(s.lat-H.lat,s.lon-H.lon)>=4 && s.name.toLowerCase()!==String(H.name).toLowerCase() && !(this._c.skip_stops||[]).includes(s.name));
    R.push({name:H.name+" 🏠", lat:H.lat, lon:H.lon, t:t0, home:true}); R.sort((a,b)=>a.t-b.t);
    /* drop stops that would force an implausible hop (e.g. a home in southern Africa squeezed between two distant stops) */
    const gcd=(a,b)=>{ const r=Math.PI/180, c=Math.sin(a.lat*r)*Math.sin(b.lat*r)+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.cos((a.lon-b.lon)*r); return Math.acos(Math.max(-1,Math.min(1,c)))*6371; };
    for(let g=0; g<40; g++){ let rm=-1; for(let i=0;i<R.length-1;i++){ const a=R[i], b=R[i+1];
        if(gcd(a,b)/Math.max(b.t-a.t,1) > 6500/60){ rm = b.home ? i : (a.home ? i+1 : i); break; } }
      if(rm<0) break; R.splice(rm,1); }
    const np=this._tr.sl_np; R.unshift({name:np, lat:84, lon:179.5, t:R[0].t-45}); R.push({name:np, lat:84, lon:-170, t:R[R.length-1].t+90}); this._route=R; }
  _build(){
    const r=this.shadowRoot||this.attachShadow({mode:"open"}); r.innerHTML=""; const t=this._t;
    css(r, BASE_CSS+`
      .map{position:relative;width:100%;aspect-ratio:2/1;border-radius:14px;overflow:hidden;
        background:radial-gradient(ellipse at 50% 120%,#173a6a 0%,#0a1630 60%,#050b1c 100%);border:1px solid rgba(255,214,120,.35)}
      svg{position:absolute;inset:0;width:100%;height:100%}
      .st{display:grid;gap:8px;margin-top:12px}
      .row{display:grid;grid-template-columns:1.4fr 2fr auto;gap:10px;align-items:center;font-size:14px}
      .pb{height:10px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
      .pb i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#d6202f,#ffd878,#2ecc71)}
      .big{margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(14,110,58,.45);border:1px solid rgba(126,240,168,.5);font-size:16px;font-weight:700;line-height:1.4}
      .eta{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;padding:10px 14px;border-radius:14px;
        background:rgba(214,32,47,.35);border:1px solid rgba(255,120,120,.5);font-weight:800;font-size:18px}
      .eta span:last-child{font-variant-numeric:tabular-nums;color:#ffd878;text-align:right}
      .news{margin-top:10px;font-size:13px;opacity:.9}
      .demo{font-size:11px;opacity:.45;text-align:right;margin-top:6px}
      :host(.tab){display:block;height:100%}
      :host(.tab) .np{height:100%;display:flex;flex-direction:column;box-sizing:border-box}
      :host(.tab) .hd{padding:10px 14px 4px;font-size:clamp(15px,1.55vw,18px);gap:6px}
      :host(.tab) .hd small{font-size:clamp(10px,.95vw,11px);text-align:right;white-space:nowrap}
      :host(.tab) .bd{flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 14px 10px}
      :host(.tab) .map{flex:0 1 auto;width:100%;aspect-ratio:2.3/1;min-height:110px}
      :host(.tab) .st{gap:5px;margin-top:8px}
      :host(.tab) .row{grid-template-columns:minmax(0,max-content) minmax(56px,1fr) auto;gap:8px;font-size:clamp(12px,1.2vw,14px)}
      :host(.tab) .row > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
      :host(.tab) .pb{height:11px}
      :host(.tab) .big{font-size:clamp(13px,1.35vw,15px);margin-top:8px;padding:8px 12px;line-height:1.3}
      :host(.tab) .eta{font-size:clamp(14px,1.45vw,17px);padding:8px 12px;margin-top:8px}
      :host(.tab) .news{font-size:12px;margin-top:6px}
      :host(.tab) .demo{margin-top:4px;font-size:10px}
    `);
    r.innerHTML+=`<ha-card class="np"><div class="hd" id="hd">${this._c.title?esc(this._c.title):t.sl_title}<small id="mode">${t.sl_radar}</small></div><div class="bd">
      <div class="map"><svg id="svg" viewBox="0 0 360 180" preserveAspectRatio="none"></svg></div><div id="info"></div>
      <div class="demo">${t.sl_hint}</div></div></ha-card>`;
    const demo=()=>{ this._demo=!this._demo; this._demoStart=Date.now(); this._tick(); };
    longPress(r.getElementById("hd"),900,demo); keyAct(r.getElementById("hd"), null, demo);
    if(this._hass||this._c.home&&typeof this._c.home==="object"){ this._makeRoute(); this._drawBase(); }
  }
  _xy(lat,lon){ return [lon+180, 90-lat]; }
  _path(pts){ let d=""; for(let i=0;i<pts.length;i++){ const [la,lo]=pts[i];
      if(i===0){ const [x,y]=this._xy(la,lo); d+=`M${x},${y}`; continue; }
      const [pla,plo]=pts[i-1]; const dl=lo-plo;
      if(Math.abs(dl)>180){ const w=dl>0?-1:1; const edge=w<0?-180:180; const span=w<0?(plo+180)+(180-lo):(180-plo)+(lo+180);
        const f=Math.abs(edge-plo)/span; const lat=pla+(la-pla)*f; const [x1,y1]=this._xy(lat,edge); const [x2,y2]=this._xy(lat,-edge); d+=`L${x1},${y1}M${x2},${y2}`; }
      const [x,y]=this._xy(la,lo); d+=`L${x},${y}`; } return d; }
  _drawBase(){
    const svg=this.shadowRoot.getElementById("svg"); if(!svg||!this._route) return; let s="";
    for(let x=0;x<=360;x+=30) s+=`<line x1="${x}" y1="0" x2="${x}" y2="180" stroke="rgba(120,170,255,.12)" stroke-width=".4"/>`;
    for(let y=0;y<=180;y+=30) s+=`<line x1="0" y1="${y}" x2="360" y2="${y}" stroke="rgba(120,170,255,.12)" stroke-width=".4"/>`;
    for(let i=0;i<70;i++){ const x=(i*97)%360, y=(i*53)%180; s+=`<circle cx="${x}" cy="${y}" r="${(i%3)*0.25+0.25}" fill="rgba(255,255,255,${0.2+(i%5)/10})"/>`; }
    s+=`<path d="${LAND}" fill="rgba(46,204,113,.16)" stroke="rgba(126,240,168,.4)" stroke-width=".35" stroke-linejoin="round"/>`;
    s+=`<path d="${this._path(this._route.map(p=>[p.lat,p.lon]))}" fill="none" stroke="rgba(255,214,120,.35)" stroke-width=".7" stroke-dasharray="2 2"/>`;
    s+=`<path id="done" d="" fill="none" stroke="#ffd878" stroke-width="1.2"/>`;
    this._route.forEach((p,i)=>{ const [x,y]=this._xy(p.lat,p.lon); const home=!!p.home;
      s+=`<circle cx="${x}" cy="${y}" r="${home?2.6:1.4}" fill="${home?"#ff3b4a":"#fff"}" ${home?'stroke="#ffd878" stroke-width=".8"':''}/>`;
      if(home) s+=`<text x="${x+3}" y="${y-3}" font-size="7" fill="#ffd878" font-weight="700">${esc(this._homeName)}</text>`; });
    s+=`<g id="sl"><circle r="6" fill="rgba(255,60,74,.35)">${reducedMotion()?"":`<animate attributeName="r" values="3;8;3" dur="1.6s" repeatCount="indefinite"/>`}</circle><text font-size="12" text-anchor="middle" dy="4">🛷</text></g>`;
    svg.innerHTML=s;
  }
  _dlabel(){ const [mo,d]=dateMD(this._c); return new Date(2000,mo,d).toLocaleDateString(this._tr.locale,{day:"numeric",month:"long"}); }
  _wall(now){ return nowInTz(this._c.time_zone||(this._hass&&this._hass.config&&this._hass.config.time_zone), now); }
  _base(now){ const [mo,d]=dateMD(this._c); return Date.UTC(eventYear(this._wall(now),this._c),mo,d); }   // celebration day 00:00 UTC (default 24/12)
  _pos(min){
    const R=this._route; if(min<=R[0].t) return {i:0,f:0,lat:R[0].lat,lon:R[0].lon,state:"pre"};
    for(let i=0;i<R.length-1;i++){ const a=R[i],b=R[i+1]; if(min<=b.t){ const f=(min-a.t)/(b.t-a.t);
      let dl=b.lon-a.lon; if(dl>180) dl-=360; if(dl<-180) dl+=360; let lon=a.lon+dl*f; if(lon>180) lon-=360; if(lon<-180) lon+=360;
      return {i,f,lat:a.lat+(b.lat-a.lat)*f,lon,state:"fly"}; } }
    const L=R[R.length-1]; return {i:R.length-1,f:1,lat:L.lat,lon:L.lon,state:"done"};
  }
  _demoMin(el){ const R=this._route, a=R[0].t-15, b=this._homeT-30, c=this._homeT+20, d=R[R.length-1].t+10;
    if(el<30) return a+(b-a)*el/30; if(el<45) return b+(c-b)*(el-30)/15; return c+(d-c)*(el-45)/15; }
  _tick(){
    if(!this._route) return; const t=this._t, R=this._route; const now=new Date(); let min;
    const real=(now-this._base(now))/60000;
    if(this._demo){ const el=(Date.now()-this._demoStart)/1000; min=this._demoMin(el); if(min>R[R.length-1].t+10){this._demo=false; min=undefined;} }
    else if(real>=Math.min(-this._homeOff*60,R[0].t-120) && real<=R[R.length-1].t+30) min=real;
    const sr=this.shadowRoot, info=sr.getElementById("info"), mode=sr.getElementById("mode"), sl=sr.getElementById("sl"); if(!sl) return;
    if(min===undefined){
      mode.textContent=this._tr.sl_status;
      const tz=this._c.time_zone||(this._hass&&this._hass.config&&this._hass.config.time_zone);
      const end=new Date(xmasTarget(nowInTz(tz,now),this._c,tz).ms), start=new Date(end.getTime()-53*86400000); let q=(now-start)/(end-start); q=Math.max(0.03,Math.min(0.995,q));
      const after = real>R[R.length-1].t+30;   /* until the season rolls over (eventYear) */
      const V=[Math.round(20+79*q),Math.round(35+64*Math.min(1,q*1.2)),Math.round(50+49*q),Math.round(10+88*q*q),Math.round(5+94*q)];
      const rows=after?t.sl_after_rows.map(k=>[k,100]):t.sl_rows.map((k,i)=>[k,V[i]]);
      const news=t.sl_news[(now.getDate()*24+now.getHours())%t.sl_news.length];
      const [x,y]=this._xy(R[0].lat,R[0].lon); sl.setAttribute("transform",`translate(${x},${y})`); sr.getElementById("done").setAttribute("d","");
      info.innerHTML=`<div class="st">${rows.map(([k,v])=>`<div class="row"><span>${k}</span><div class="pb"><i style="width:${v}%"></i></div><b>${v}%</b></div>`).join("")}</div>
        <div class="big">${after?t.sl_after:`🛠️ ${news}`}</div>${after?"":`<div class="news">${F(t.sl_parked,{home:esc(this._homeName),eta:esc(this._c.eta),date:esc(this._dlabel())})}</div>`}`;
      return;
    }
    const p=this._pos(min); mode.textContent=this._demo?this._tr.sl_demo_mode:F(this._tr.sl_live,{date:this._dlabel()});
    const [x,y]=this._xy(p.lat,p.lon); sl.setAttribute("transform",`translate(${x},${y})`);
    const done=R.slice(0,p.i+1).map(s=>[s.lat,s.lon]); if(p.state==="fly") done.push([p.lat,p.lon]);
    sr.getElementById("done").setAttribute("d", p.state==="pre"?"":this._path(done));
    const gifts = p.state==="pre"?0: Math.min(2400, Math.round(2400*Math.max(0,(min-R[1].t))/(R[R.length-2].t-R[1].t)));
    const dep=new Date(this._base(now)+R[0].t*60000).toLocaleTimeString(this._tr.locale,{hour:"2-digit",minute:"2-digit"});
    const toHome=this._homeT-min; let where;
    if(p.state==="pre") where=F(t.sl_pre,{t:dep});
    else if(p.state==="done") where=t.sl_done;
    else if(toHome<=1 && toHome>-20) where=F(t.sl_here,{home:esc(this._homeName)});
    else where = p.f<0.15 ? F(t.sl_land,{a:esc(R[p.i].name)}) : F(t.sl_fly,{a:esc(R[p.i].name),b:esc(R[p.i+1].name)});
    let eta; if(toHome>60) eta=F(t.sl_in_h,{h:Math.floor(toHome/60),m:Math.floor(toHome%60)}); else if(toHome>5) eta=F(t.sl_in_m,{m:Math.ceil(toHome)});
    else if(toHome>-20) eta=t.sl_now; else eta=t.sl_been;
    const speed = p.state==="fly" ? (8000+Math.round(Math.abs(Math.sin(min))*4000)).toLocaleString(this._tr.locale) : "0";
    info.innerHTML=`<div class="big">${where}<br><span style="font-weight:500;font-size:.9em">${F(t.sl_gifts,{n:gifts.toLocaleString(this._tr.locale)})} · ${F(t.sl_speed,{s:speed})} · ${t.sl_rudolf}</span></div>
      <div class="eta"><span>${F(t.sl_eta,{home:esc(this._homeName)})}</span><span>${eta}</span></div>`;
  }
  connectedCallback(){ this._iv=setInterval(()=>this._tick(),1000); this._fast=setInterval(()=>{ if(this._demo) this._tick(); },200); this._tick(); }
  disconnectedCallback(){ clearInterval(this._iv); clearInterval(this._fast); }
}


/* ---------- TABLET BOARD (panel view) ---------- */
class NordpolBoard extends HTMLElement {
  static getConfigElement(){ return document.createElement("nordpol-board-card-editor"); }
  static getStubConfig(hass, entities){ return {default_tab:"sleigh",cams:{cams:[{label:"CAM 01 – REINDEER PADDOCK"},{label:"CAM 02 – TOY WORKSHOP"},{label:"CAM 03 – MAILROOM"},{label:"CAM 04 – BAKERY"}]},sleigh:{eta:"23:59"},nice:hasDefaultTodo(hass,entities)?{store:"todo.nordpol_nice_list"}:{},elf:{}}; }
  setConfig(c){ this._c=c||{}; this._build(); this._checkVersion(); }
  set hass(h){ this._hass=h; (this._kids||[]).forEach(k=>k.hass=h); }
  /* If the dashboard config asks for a newer card (min_version) than the JS this browser has loaded, reload once so a
     long-running tablet picks up the new resource instead of running old code against new config. */
  _checkVersion(){ const need=this._c.min_version; if(!need) return; const cmp=(a,b)=>{ const x=String(a).split(".").map(Number), y=String(b).split(".").map(Number);
      for(let i=0;i<3;i++){ const d=(x[i]||0)-(y[i]||0); if(d) return d; } return 0; };
    if(cmp(VER,need)>=0) return; const key="nordpol-reload-"+need; let n=0; try{ n=+sessionStorage.getItem(key)||0; }catch(e){}
    const r=this.shadowRoot; const bn=document.createElement("div"); bn.textContent=TRaw(this._c).stale+` (v${VER} → v${need})`;
    bn.style.cssText="position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:50;background:#b3121f;color:#fff;font:700 16px system-ui;padding:10px 18px;border-radius:12px;border:2px solid #ffd878;cursor:pointer";
    bn.addEventListener("click",()=>location.reload()); r.appendChild(bn);
    if(n<2){ try{ sessionStorage.setItem(key,String(n+1)); }catch(e){} setTimeout(()=>location.reload(),4000); } }
  set preview(v){ this._preview=!!v; (this._kids||[]).forEach(k=>{ k.preview=this._preview; }); }
  get preview(){ return !!this._preview; }
  getCardSize(){ return 12; }
  getGridOptions(){ return {columns:"full", rows:"auto"}; }
  _mk(tag,cfg,cls){ const e=document.createElement(tag); const base={}; for(const k of ["language","strings","date","target","time_zone"]) if(this._c[k]) base[k]=this._c[k]; e.setConfig(Object.assign(base,cfg||{})); if(cls) cls.split(" ").forEach(x=>e.classList.add(x)); if(this._hass) e.hass=this._hass; if(this._preview) e.preview=true; this._kids.push(e); return e; }
  _build(){
    const r=this.shadowRoot||this.attachShadow({mode:"open"}); r.innerHTML=""; this._kids=[];
    css(r, `
    :host{display:block}
    .board{box-sizing:border-box;padding:12px;display:grid;gap:12px;
      grid-template-columns:minmax(0,1.6fr) minmax(330px,1fr);grid-template-rows:auto minmax(0,1fr);
      grid-template-areas:"hero side" "cams side";
      height:calc(100dvh - var(--header-height,56px) - env(safe-area-inset-top,0px));min-height:560px}
    .hero{grid-area:hero;min-width:0}.cams{grid-area:cams;min-height:0;min-width:0}
    .side{grid-area:side;min-height:0;min-width:0;display:flex;flex-direction:column;gap:8px}
    .tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:6px}
    .tabs button{font:800 clamp(12px,1.3vw,16px) system-ui,sans-serif;min-height:46px;border-radius:14px;cursor:pointer;color:#fff8e7;
      border:1.5px solid rgba(255,214,120,.5);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.03));
      box-shadow:0 4px 12px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;padding:4px 4px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tabs button.on{background:linear-gradient(180deg,#d6202f,#8d0f19);border-color:#ffd878;box-shadow:0 0 16px rgba(214,32,47,.6)}
    .tabs button span{display:block;font-size:clamp(17px,1.8vw,20px);line-height:1}
    .pane{flex:1;min-height:0;overflow:auto;border-radius:22px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .pane::-webkit-scrollbar{display:none}
    .pane > *{display:none}.pane > .show{display:block;height:100%}
    @media (orientation: portrait), (max-width: 860px){
      .board{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;grid-template-areas:"hero" "cams" "side";height:auto;min-height:0}
      .cams{height:min(calc(56vw + 110px),720px)}
      .pane{overflow:visible}
    }`);
    const b=document.createElement("div"); b.className="board"; r.appendChild(b);
    const hero=document.createElement("div"); hero.className="hero"; const cams=document.createElement("div"); cams.className="cams";
    const side=document.createElement("div"); side.className="side"; b.append(hero,cams,side);
    hero.appendChild(this._mk("nordpol-hero-card",this._c.hero,"compact"));
    cams.appendChild(this._mk("nordpol-cam-card",this._c.cams,"fill"));
    const L=T(this._c); const tabs=[["sleigh","🛷",L.tab_sleigh,"nordpol-sleigh-card"],["nice","⭐",L.tab_nice,"nordpol-nice-card"],["elf","🧝",L.tab_elf,"nordpol-elf-card"]];
    const bar=document.createElement("div"); bar.className="tabs"; bar.setAttribute("role","tablist"); const pane=document.createElement("div"); pane.className="pane";
    side.append(bar,pane);
    this._tabEls={}; this._btns={};
    for(const [k,ic,lbl,tag] of tabs){ const btn=document.createElement("button"); btn.innerHTML=`<span aria-hidden="true">${ic}</span>${lbl}`; btn.setAttribute("role","tab");
      btn.addEventListener("click",()=>this._show(k,true)); bar.appendChild(btn); this._btns[k]=btn;
      const el=this._mk(tag,this._c[k],"tab"); pane.appendChild(el); this._tabEls[k]=el; }
    /* Optional extra button, e.g. home_button: {label: "Home", icon: "🏠", path: "/lovelace/0"} */
    const hb=this._c.home_button;
    if(hb && hb.path){ const homeBtn=document.createElement("button"); homeBtn.innerHTML=`<span>${esc(hb.icon||"🏠")}</span>${esc(hb.label||"Home")}`;
      homeBtn.addEventListener("click",()=>{ history.pushState(null,"",hb.path); window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:false}})); });
      bar.appendChild(homeBtn); }
    this._show(this._c.default_tab||"sleigh");
  }
  _show(k,user){ for(const t in this._tabEls){ this._tabEls[t].classList.toggle("show",t===k); this._btns[t].classList.toggle("on",t===k); this._btns[t].setAttribute("aria-selected",t===k?"true":"false"); }
    clearTimeout(this._back); if(user && k!==(this._c.default_tab||"sleigh")) this._back=setTimeout(()=>this._show(this._c.default_tab||"sleigh"),(this._c.return_after_min||3)*60000); }
  disconnectedCallback(){ clearTimeout(this._back); }
}

/* ---------- VISUAL CONFIG EDITOR (nordpol-board-card) ---------- */
class NordpolBoardEditor extends HTMLElement {
  connectedCallback(){
    if(!customElements.get("ha-form")){
      try{ window.loadCardHelpers && Promise.resolve(window.loadCardHelpers()).catch(()=>{}); }catch(e){}
      if(!this._waitHa){ this._waitHa=true; customElements.whenDefined("ha-form").then(()=>{ if(this.isConnected) this._render(); }); }
    }else if(this._c && !this._form){ this._render(); }
  }
  setConfig(c){ this._c=Object.assign({},c||{}); this._render(); }
  set hass(h){ const first=!this._hass; this._hass=h; if(this._form) this._form.hass=h; else if(first) this._render(); }
  _emit(next){ this._c=next; this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:next},bubbles:true,composed:true})); }
  _toForm(c){
    c=c||{};
    const camOv=c.cams&&c.cams.overlay;
    const ov=(camOv===false||camOv==="false"||camOv==="off")?"off":(camOv===true||camOv==="true"||camOv==="cctv")?"cctv":"minimal";
    return {
      language: c.language||"",
      default_tab: c.default_tab||"sleigh",
      date: c.date||"",
      target: (c.hero&&c.hero.target)||c.target||"",
      eta: (c.sleigh&&c.sleigh.eta)||"",
      store: (c.nice&&c.nice.store)||"",
      overlay: ov,
      cctv_style: (c.cams&&c.cams.cctv_style)||"color",
      home_button_path: (c.home_button&&c.home_button.path)||"",
      time_zone: c.time_zone||"",
      snow: !c.hero||c.hero.snow!==false
    };
  }
  _fromForm(v){
    const n=JSON.parse(JSON.stringify(this._c||{}));
    const s=k=>v[k]!=null?String(v[k]).trim():"";
    const lg=s("language"); if(lg) n.language=lg; else delete n.language;
    n.default_tab=v.default_tab||"sleigh";
    const dt=s("date"); if(dt&&dt!=="12-24") n.date=dt; else delete n.date;
    const tgt=s("target"); if(tgt) n.hero=Object.assign({},n.hero,{target:tgt}); else { if(n.hero) delete n.hero.target; delete n.target; }
    const eta=s("eta"); if(eta) n.sleigh=Object.assign({},n.sleigh,{eta}); else if(n.sleigh) delete n.sleigh.eta;
    const st=s("store"); if(st) n.nice=Object.assign({},n.nice,{store:st}); else if(n.nice) delete n.nice.store;
    const ov=v.overlay; n.cams=Object.assign({},n.cams,{overlay:ov==="off"||ov===false?false:ov==="cctv"||ov===true?true:"minimal"});
    const cs=v.cctv_style; if(cs&&cs!=="color") n.cams=Object.assign({},n.cams,{cctv_style:cs}); else if(n.cams) delete n.cams.cctv_style;
    const hb=s("home_button_path"); if(hb) n.home_button=Object.assign({label:"Home",icon:"🏠"},n.home_button,{path:hb}); else delete n.home_button;
    const tz=s("time_zone"); if(tz) n.time_zone=tz; else delete n.time_zone;
    n.hero=Object.assign({},n.hero,{snow:v.snow!==false});
    return n;
  }
  _render(){
    const r=this.shadowRoot||this.attachShadow({mode:"open"}); const c=this._c||{};
    const lg=langOf(c), ed=edOf(c), TR=TRaw(c);
    if(customElements.get("ha-form")){
      const sk=lg+"|"+JSON.stringify(c.strings||"");
      if(!this._schema || this._schemaKey!==sk){
        const tabs=[{value:"sleigh",label:"🛷 "+TR.tab_sleigh},{value:"nice",label:"⭐ "+TR.tab_nice},{value:"elf",label:"🧝 "+TR.tab_elf}];
        this._schemaKey=sk;
        this._schema=[
          {type:"grid", schema:[
            {name:"language", selector:{select:{mode:"dropdown", options:LANG_OPTS}}},
            {name:"default_tab", default:"sleigh", selector:{select:{mode:"dropdown", options:tabs}}}
          ]},
          {type:"grid", schema:[
            {name:"date", selector:{text:{}}},
            {name:"target", selector:{text:{}}}
          ]},
          {type:"grid", schema:[
            {name:"eta", default:"23:59", selector:{text:{}}},
            {name:"store", selector:{entity:{filter:{domain:"todo"}}}}
          ]},
          {type:"grid", schema:[
            {name:"overlay", default:"minimal", selector:{select:{mode:"dropdown", options:ovOpts(c)}}},
            {name:"cctv_style", default:"color", selector:{select:{mode:"dropdown", options:cctvOpts(c)}}}
          ]},
          {type:"grid", schema:[
            {name:"home_button_path", selector:{text:{}}},
            {name:"time_zone", selector:{text:{}}}
          ]},
          {name:"snow", default:true, selector:{boolean:{}}}
        ];
      }
      if(!this._form){
        r.innerHTML=`<style>.note{margin-top:10px;font-size:12px;color:var(--secondary-text-color,#666)}</style><div class="note" id="tip"></div>`;
        const f=this._form=document.createElement("ha-form");
        f.computeLabel=(s,d)=>mkLabel(this._c)(s,d);
        f.computeHelper=(s,d)=>mkHelper(this._c)(s,d);
        f.addEventListener("value-changed",e=>{ const v=e.detail&&e.detail.value; if(v) this._emit(this._fromForm(v)); });
        r.insertBefore(f, r.getElementById("tip"));
      }
      const f=this._form;
      if(f.schema!==this._schema) f.schema=this._schema;
      f.data=this._toForm(c);
      if(this._hass) f.hass=this._hass;
      r.getElementById("tip").textContent=ed.tip;
      return;
    }
    this._form=null; this._schema=null; this._schemaKey=null;
    const todos=this._hass?Object.keys(this._hass.states).filter(k=>k.startsWith("todo.")).sort():[];
    const niceStore=(c.nice&&c.nice.store)||""; const camOv=(c.cams&&c.cams.overlay);
    const ovVal=(camOv===false||camOv==="false"||camOv==="off")?"off":(camOv===true||camOv==="true"||camOv==="cctv")?"cctv":"minimal";
    const cctvVal=(c.cams&&c.cams.cctv_style)||"color";
    const snowOn=!c.hero||c.hero.snow!==false; const hb=(c.home_button&&c.home_button.path)||"";
    const tgt=(c.hero&&c.hero.target)||c.target||"";
    const tgtPh=defaultTarget(c);   /* same default as the card: 12-25 00:00 for fr/es/nl/it/pt, custom date → 00:00 */
    r.innerHTML=`<style>
      .ed{display:grid;gap:12px;font-family:var(--paper-font-body1_-_font-family,system-ui,sans-serif);color:var(--primary-text-color,#222)}
      .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      label{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600}
      input,select{box-sizing:border-box;width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);
        background:var(--card-background-color,#fff);color:var(--primary-text-color,#222);font-size:14px}
      .chk{flex-direction:row;align-items:center;gap:8px;font-weight:600;cursor:pointer}
      .chk input{width:auto}
      .note{font-size:12px;opacity:.7;margin-top:-4px}
    </style><div class="ed">
      <div class="row">
        <label>${esc(ed.lang)}
          <select id="lang">${LANG_OPTS.map(o=>`<option value="${esc(o.value)}" ${(c.language||"")===o.value?"selected":""}>${esc(o.label)}</option>`).join("")}</select>
        </label>
        <label>${esc(ed.tab)}
          <select id="tab"><option value="sleigh" ${(c.default_tab||"sleigh")==="sleigh"?"selected":""}>🛷 ${esc(TR.tab_sleigh)}</option><option value="nice" ${c.default_tab==="nice"?"selected":""}>⭐ ${esc(TR.tab_nice)}</option><option value="elf" ${c.default_tab==="elf"?"selected":""}>🧝 ${esc(TR.tab_elf)}</option></select>
        </label>
      </div>
      <div class="row">
        <label>${esc(ed.date)}
          <input id="date" placeholder="12-24" value="${esc(c.date||"")}">
        </label>
        <label>${esc(ed.target)}
          <input id="target" placeholder="${tgtPh}" value="${esc(tgt)}">
        </label>
      </div>
      <div class="row">
        <label>${esc(ed.eta)}
          <input id="eta" placeholder="23:59" value="${esc((c.sleigh&&c.sleigh.eta)||"")}">
        </label>
        <label>${esc(ed.store)}
          ${todos.length?`<select id="store"><option value="">— ${esc(ed.sel)} —</option>${todos.map(id=>`<option value="${esc(id)}" ${niceStore===id?"selected":""}>${esc(id)}</option>`).join("")}</select>`:
          `<input id="store" placeholder="todo.nordpol_nice_list" value="${esc(niceStore)}">`}
        </label>
      </div>
      <div class="row">
        <label>${esc(ed.ov)}
          <select id="ov">${ovOpts(c).map(o=>`<option value="${esc(o.value)}" ${ovVal===o.value?"selected":""}>${esc(o.label)}</option>`).join("")}</select>
        </label>
        <label>${esc(ed.cctv)}
          <select id="cctv">${cctvOpts(c).map(o=>`<option value="${esc(o.value)}" ${cctvVal===o.value?"selected":""}>${esc(o.label)}</option>`).join("")}</select>
        </label>
      </div>
      <div class="row">
        <label>${esc(ed.hb)}
          <input id="hb" placeholder="/lovelace/0" value="${esc(hb)}">
        </label>
        <label>${esc(ed.tz)}
          <input id="tz" placeholder="Europe/Copenhagen" value="${esc(c.time_zone||"")}">
        </label>
      </div>
      <label class="chk"><input type="checkbox" id="snow" ${snowOn?"checked":""}> ${esc(ed.snow)}</label>
      <div class="note">${esc(ed.tip)}</div>
    </div>`;
    const $=id=>r.getElementById(id);
    const upd=fn=>{ const n=JSON.parse(JSON.stringify(this._c||{})); fn(n); this._emit(n); };
    $("lang").addEventListener("change",e=>upd(n=>{ if(e.target.value) n.language=e.target.value; else delete n.language; }));
    $("tab").addEventListener("change",e=>upd(n=>{ n.default_tab=e.target.value; }));
    $("date").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v&&v!=="12-24") n.date=v; else delete n.date; }));
    $("target").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v) n.hero=Object.assign({},n.hero,{target:v}); else { if(n.hero) delete n.hero.target; delete n.target; } }));
    $("eta").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v) n.sleigh=Object.assign({},n.sleigh,{eta:v}); else if(n.sleigh) delete n.sleigh.eta; }));
    $("store").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v) n.nice=Object.assign({},n.nice,{store:v}); else if(n.nice) delete n.nice.store; }));
    $("ov").addEventListener("change",e=>upd(n=>{ const v=e.target.value; n.cams=Object.assign({},n.cams,{overlay:v==="off"?false:v==="cctv"?true:"minimal"}); }));
    $("cctv").addEventListener("change",e=>upd(n=>{ const v=e.target.value; if(v&&v!=="color") n.cams=Object.assign({},n.cams,{cctv_style:v}); else if(n.cams) delete n.cams.cctv_style; }));
    $("hb").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v) n.home_button=Object.assign({label:"Home",icon:"🏠"},n.home_button,{path:v}); else delete n.home_button; }));
    $("tz").addEventListener("change",e=>upd(n=>{ const v=e.target.value.trim(); if(v) n.time_zone=v; else delete n.time_zone; }));
    $("snow").addEventListener("change",e=>upd(n=>{ n.hero=Object.assign({},n.hero,{snow:e.target.checked}); }));
  }
}
if(!customElements.get("nordpol-board-card-editor")) customElements.define("nordpol-board-card-editor", NordpolBoardEditor);

const defs=[["nordpol-board-card",NordpolBoard,"Nordpol: tablet board"],["nordpol-hero-card",NordpolHero,"Nordpol: countdown"],["nordpol-cam-card",NordpolCams,"Nordpol: elf cams"],
 ["nordpol-nice-card",NordpolNice,"Nordpol: nice list"],["nordpol-elf-card",NordpolElf,"Nordpol: elf of the day"],["nordpol-sleigh-card",NordpolSleigh,"Nordpol: sleigh tracker"]];
window.customCards=window.customCards||[];
for(const [n,c,t] of defs){ if(!customElements.get(n)){ customElements.define(n,c); window.customCards.push({type:n,name:t,description:"Nordpol Christmas card",preview:true,documentationURL:REPO_URL}); } }
console.info(`%c NORDPOL-CARD %c v${VER} `,"background:#b3121f;color:#fff;font-weight:700","background:#0e6e3a;color:#fff");
})();
