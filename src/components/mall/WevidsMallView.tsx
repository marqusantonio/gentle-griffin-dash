import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  ShoppingBag, 
  Sparkles, 
  Star, 
  Tag, 
  ShoppingCart, 
  Check, 
  CreditCard, 
  Trash2, 
  Zap, 
  ArrowRight
} from 'lucide-react';
import { ProductItem } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const WevidsMallView: React.FC = () => {
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    isCartOpen,
    setIsCartOpen,
    currentUser
  } = useWevids();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', 'Digital ROMs', 'Presets & LUTs', 'Gaming Gear', 'AI Prompts'];

  const filteredProducts = products.filter((p) => 
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    sounds.success();
    toast.success('Order placed successfully via WEVIDS Escrow!');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/30 text-[#fbbf24] font-bold text-xs mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>GLOBAL CREATOR MARKETPLACE</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            WEVIDS Mall & Digital Assets
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Instant digital downloads for HyperOS themes, gaming governors, hardware merch, and creator LUTs.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.pop();
            setIsCartOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>VIEW CART ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => {
              sounds.click();
              setSelectedCategory(c);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === c
                ? 'bg-[#fbbf24] text-slate-900 font-bold shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="liquid-glass-card rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between hover:border-[#fbbf24]/50 transition-all shadow-xl group"
          >
            <div className="relative aspect-video overflow-hidden bg-black">
              <img
                src={prod.previewUrl}
                alt={prod.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#fbbf24] border border-[#fbbf24]/30 font-orbitron">
                {prod.category}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-[#8a8aa8] mb-1">
                  <span>By {prod.creatorName}</span>
                  <div className="flex items-center gap-1 text-[#fbbf24]">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">{prod.rating}</span>
                    <span>({prod.salesCount})</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">{prod.title}</h3>
                <p className="text-xs text-[#8a8aa8] line-clamp-2 mt-1">{prod.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#8a8aa8]">PRICE</div>
                  <div className="font-orbitron font-bold text-lg text-[#00e5ff]">
                    ${prod.price.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(prod)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs hover:scale-105 transition-transform shadow-md"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md h-full liquid-glass border-l border-white/20 p-6 flex flex-col justify-between shadow-2xl animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#fbbf24]" />
                  Your Cart ({cart.length})
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs text-[#8a8aa8] hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-[#8a8aa8] text-xs">
                    Your cart is currently empty.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <img
                        src={item.product.previewUrl}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.product.title}</div>
                        <div className="text-[11px] text-[#00e5ff] font-orbitron font-bold">
                          ${item.product.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.product.id, Number(e.target.value))}
                          className="w-12 px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white text-center"
                        />
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#8a8aa8] hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total and Checkout */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#8a8aa8]">Subtotal:</span>
                  <span className="font-orbitron font-bold text-lg text-white">
                    ${cartTotal.toFixed(2)} USD
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  COMPLETE PURCHASE WITH ESCROW
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};