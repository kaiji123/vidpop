// Demo advertiser product page. Everything here is fictional: the "Buy now" flow
// shows an order summary and stops. No payment details are ever asked for.
import { PRODUCTS, productById, formatPrice, type Product } from './ads/catalog';

const params = new URLSearchParams(location.search);
const product = productById(params.get('p')) ?? PRODUCTS[0];
const $ = (id: string) => document.getElementById(id)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
let cart = 0;

document.title = `${product.name} · ${product.store.name} (demo)`;
document.documentElement.style.setProperty('--brand', product.store.color);
$('store').textContent = product.store.name;
$('tagline').textContent = product.store.tagline;
$('q').textContent = params.get('q') || product.name;

// Tickets, passes and subscriptions arrive by email, not by courier.
const DIGITAL = new Set(['rl-jp7', 'rl-jp14', 'rl-eurail', 'rl-airport', 'rl-esim', 'pt-audio']);
const stars = (r: number) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const saving = product.was ? Math.round((1 - product.price / product.was) * 100) : 0;

$('product').innerHTML = `
  <div class="hero" aria-hidden="true">${product.emoji}</div>
  <div>
    <h1>${esc(product.name)}</h1>
    <div class="rating">${stars(product.rating)} ${product.rating.toFixed(1)} · ${product.reviews.toLocaleString()} reviews</div>
    <div class="price">${formatPrice(product.price)}${product.was ? `<s>${formatPrice(product.was)}</s>` : ''}</div>
    ${saving ? `<span class="save">Save ${saving}%</span>` : ''}
    <p class="blurb">${esc(product.blurb)}</p>
    <div class="ship">${DIGITAL.has(product.id) ? '✓ Delivered instantly by email · Free cancellation before first use' : '✓ In stock · Free delivery in 2–3 days · 30-day returns'}</div>
    <label class="qty">Quantity
      <select id="qty">${[1, 2, 3, 4, 5].map((n) => `<option>${n}</option>`).join('')}</select>
    </label>
    <div class="buttons">
      <button class="buy" id="buy">Buy now</button>
      <button class="add" id="add">Add to cart</button>
    </div>
  </div>`;

const qty = () => Number(($('qty') as HTMLSelectElement).value);

$('add').addEventListener('click', () => {
  cart += qty();
  $('cart').textContent = `🛒 ${cart}`;
  ($('add') as HTMLButtonElement).textContent = 'Added ✓';
  setTimeout(() => (($('add') as HTMLButtonElement).textContent = 'Add to cart'), 1500);
});

const dialog = $('checkout') as HTMLDialogElement;
$('buy').addEventListener('click', () => {
  const n = qty();
  const subtotal = product.price * n;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  dialog.innerHTML = `
    <span class="tag">Demo checkout</span>
    <h3>Order summary</h3>
    <div class="row"><span>${esc(product.name)} × ${n}</span><span>${formatPrice(subtotal)}</span></div>
    <div class="row"><span>Delivery</span><span>Free</span></div>
    <div class="row"><span>Estimated tax</span><span>${formatPrice(tax)}</span></div>
    <div class="row total"><span>Total</span><span>${formatPrice(subtotal + tax)}</span></div>
    <p class="note">This is where the advertiser's real checkout would take over. In this demo no order is placed and no payment is taken.</p>
    <div class="buttons">
      <button class="add" id="close">Keep browsing</button>
      <button class="buy" id="back">Back to video</button>
    </div>`;
  dialog.showModal();
  $('close').addEventListener('click', () => dialog.close());
  $('back').addEventListener('click', () => history.back());
});

const related: Product[] = PRODUCTS.filter((p) => p.store.id === product.store.id && p.id !== product.id);
$('related').innerHTML = related
  .map(
    (p) => `<a href="?p=${p.id}&q=${encodeURIComponent(params.get('q') || '')}">
      <div class="tile" aria-hidden="true">${p.emoji}</div>
      <strong>${esc(p.name)}</strong>
      <span>${formatPrice(p.price)}</span>
    </a>`,
  )
  .join('');
