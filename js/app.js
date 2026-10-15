const C = window.SHOP_CONFIG, F = C.features || {};
const U = Object.assign({
  all:"அனைத்தும்", search:"🔍 தேடுங்கள்...", add:"+ சேர்", items:"பொருட்கள்", view:"பார்க்க ›",
  order:"உங்கள் Order", pickup:"கடையில் வாங்குவேன்", delivery:"டெலிவரி", sub:"மொத்தம் (பொருட்கள்)",
  fee:"டெலிவரி கட்டணம்", total:"மொத்த தொகை", name:"உங்கள் பெயர்", phone:"மொபைல் எண் (விருப்பம்)",
  addr:"முகவரி", note:"குறிப்பு (விருப்பம்)", send:"WhatsApp-ல் Order அனுப்பு",
  needName:"உங்கள் பெயரை உள்ளிடவும்", needAddr:"முகவரியை உள்ளிடவும்", minMsg:"குறைந்தபட்ச order தொகை: ", free:"இலவசம்"
}, C.ui || {});
const $ = id => document.getElementById(id), m = n => (C.currency || "₹") + n;
const KEY = "cart_" + C.whatsapp;
let cart = {}, cat = "*", q = "", mode = "pickup";
try { cart = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
for (const i in cart) if (!C.items[i]) delete cart[i];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };

document.documentElement.style.setProperty("--g", C.theme || "#128c7e");
document.title = C.name; $("n").textContent = C.name; $("t").textContent = C.tagline || "";
$("foot").textContent = C.footer || ""; $("search").placeholder = U.search;
$("search").style.display = F.search === false ? "none" : "block";
$("oh").textContent = U.order; $("l1").textContent = U.sub; $("l2").textContent = U.fee; $("l3").textContent = U.total;
$("cname").placeholder = U.name; $("cphone").placeholder = U.phone; $("caddr").placeholder = U.addr;
$("cnote").placeholder = U.note; $("send").textContent = U.send;
$("cnote").style.display = F.note === false ? "none" : "block";
$("hint").textContent = F.fileHint ? (C.fileHint || "") : "";

function sub() { let s = 0; for (const i in cart) s += cart[i] * C.items[i].price; return s; }
function fee(s) {
  if (!F.delivery || mode !== "delivery" || !C.delivery) return 0;
  return (C.delivery.freeAbove && s >= C.delivery.freeAbove) ? 0 : C.delivery.charge;
}
function drawCats() {
  const cats = [["*", U.all], ...[...new Set(C.items.map(x => x.cat))].map(c => [c, c])];
  $("cats").innerHTML = ""; $("cats").style.display = cats.length > 2 ? "flex" : "none";
  cats.forEach(([k, label]) => {
    const b = document.createElement("button"); b.textContent = label; b.className = k === cat ? "on" : "";
    b.onclick = () => { cat = k; drawCats(); drawGrid(); }; $("cats").appendChild(b);
  });
}
function drawGrid() {
  $("grid").innerHTML = C.items.map((p, i) => ({ ...p, i })).filter(p =>
    (cat === "*" || p.cat === cat) && p.name.toLowerCase().includes(q)).map(p => `
    <div class="card"><div class="em">${p.emoji || "🛍️"}</div><h3>${p.name}</h3>
    <div><span class="price">${m(p.price)}</span> <small>/ ${p.unit || ""}</small></div>
    ${cart[p.i] ? `<div class="qty"><button onclick="setQty(${p.i},${cart[p.i] - 1})">−</button>
      <input type="number" min="0" value="${cart[p.i]}" onchange="setQty(${p.i},this.value)">
      <button onclick="setQty(${p.i},${cart[p.i] + 1})">+</button></div>`
    : `<button class="add" onclick="setQty(${p.i},1)">${U.add}</button>`}</div>`).join("");
}
function setQty(i, v) {
  v = Math.max(0, parseInt(v) || 0); v ? cart[i] = v : delete cart[i];
  save(); drawGrid(); drawBar(); if ($("modal").style.display === "flex") drawCart();
}
function drawBar() {
  const n = Object.keys(cart).length;
  $("cartbtn").style.display = n ? "flex" : "none";
  $("cc").textContent = "🛒 " + n + " " + U.items; $("ct").textContent = m(sub()) + " · " + U.view;
}
function drawCart() {
  if (!Object.keys(cart).length) return closeCart();
  $("items").innerHTML = Object.keys(cart).map(i => `<div class="row"><span>${C.items[i].name}<br>
    <small>${m(C.items[i].price)} × ${cart[i]} ${C.items[i].unit || ""}</small></span>
    <b>${m(C.items[i].price * cart[i])}</b></div>`).join("");
  const showMode = F.delivery && C.delivery;
  if (!showMode) mode = "pickup";
  $("modes").style.display = showMode ? "flex" : "none";
  $("modes").innerHTML = ["pickup", "delivery"].map(k => `<label class="${mode === k ? "on" : ""}">
    <input type="radio" name="md" onclick="mode='${k}';drawCart()">${U[k]}</label>`).join("");
  $("caddr").style.display = mode === "delivery" ? "block" : "none";
  const s = sub(), f = fee(s);
  $("frow").style.display = mode === "delivery" ? "flex" : "none";
  $("sub").textContent = m(s); $("fee").textContent = f ? m(f) : U.free; $("tot").textContent = m(s + f);
}
const openCart = () => { drawCart(); $("modal").style.display = "flex"; };
const closeCart = () => { $("modal").style.display = "none"; };
function sendOrder() {
  const s = sub(), f = fee(s), name = $("cname").value.trim(), ad = $("caddr").value.trim();
  if (F.minOrder && s < F.minOrder) return alert(U.minMsg + m(F.minOrder));
  if (!name) return alert(U.needName);
  if (mode === "delivery" && !ad) return alert(U.needAddr);
  let t = `*புதிய Order - ${C.name}*\n\n`;
  Object.keys(cart).forEach((i, k) => {
    const p = C.items[i]; t += `${k + 1}. ${p.name} × ${cart[i]} ${p.unit || ""} = ${m(p.price * cart[i])}\n`;
  });
  t += `\nபொருட்கள்: ${m(s)}`;
  if (mode === "delivery") t += `\nடெலிவரி: ${f ? m(f) : U.free}`;
  t += `\n*மொத்தம்: ${m(s + f)}*\n\n${mode === "delivery" ? U.delivery : U.pickup}\nபெயர்: ${name}`;
  if ($("cphone").value.trim()) t += `\nமொபைல்: ${$("cphone").value.trim()}`;
  if (mode === "delivery") t += `\nமுகவரி: ${ad}`;
  if ($("cnote").value.trim()) t += `\nகுறிப்பு: ${$("cnote").value.trim()}`;
  window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(t), "_blank");
}
$("search").oninput = e => { q = e.target.value.toLowerCase(); drawGrid(); };
drawCats(); drawGrid(); drawBar();
