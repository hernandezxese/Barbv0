/**
 * Regional Shop Modal (Stage 1 Don Manuel, Stage 3 Doña Millaray, Stage 5 Doña Fresia)
 * Monochrome light/black/gray palette with buy/sell tabs.
 */

import React, { useState } from 'react';
import { InventoryItem, BarbaraHero } from '../types/game';
import { sound } from '../services/audioService';
import {
  Store,
  ChevronLeft,
  Coins,
  Check,
} from 'lucide-react';

interface ShopModalProps {
  barbara: BarbaraHero;
  inventory: Record<string, InventoryItem>;
  vendorName?: string;
  regionLabel?: string;
  onBuyItem: (itemId: string, quantity: number, totalCost: number) => void;
  onSellItem?: (itemId: string, quantity: number, earnedGold: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  barbara,
  inventory,
  vendorName = 'Botica de Don Manuel',
  regionLabel = 'Comercio Regional',
  onBuyItem,
  onSellItem,
  onClose,
}) => {
  const [shopTab, setShopTab] = useState<'buy' | 'sell'>('buy');
  const [selectedItemId, setSelectedItemId] = useState<string>('matico');
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const shopCatalog = [
    {
      id: 'matico',
      name: 'Hojas de Matico',
      category: 'Salud',
      description: 'Poción de hierba medicinal chilena. Restaura 80 PS al instante.',
      icon: '🍃',
      price: 35,
      typeColor: 'text-stone-700 border-stone-300 bg-[#E7E7E2]',
    },
    {
      id: 'gota_termal',
      name: 'Gota Termal de Pucón',
      category: 'Maná (PM)',
      description: 'Agua mineral caliente con sales termales. Restaura 50 PM de energía táctica.',
      icon: '💧',
      price: 45,
      typeColor: 'text-stone-700 border-stone-300 bg-[#E7E7E2]',
    },
    {
      id: 'empanada',
      name: 'Empanada de Horno',
      category: 'Revivir',
      description: 'Nutritivo banquete tradicional. Revive a un aliado caído con 50% de PS.',
      icon: '🥟',
      price: 90,
      typeColor: 'text-stone-700 border-stone-300 bg-[#E7E7E2]',
    },
    {
      id: 'infusion_calafate',
      name: 'Infusión de Calafate',
      category: 'Cura Total',
      description: 'Brebaje de bayas silvestres. Restaura 150 PS y sana estados negativos.',
      icon: '🫐',
      price: 65,
      typeColor: 'text-stone-700 border-stone-300 bg-[#E7E7E2]',
    },
    {
      id: 'orbe_resonancia',
      name: 'Amuleto de Vínculo Pewén',
      category: 'Vínculo · Clave',
      description: 'Amuleto tallado en madera fósil andina para vincular y reclutar Criaturas Espirituales.',
      icon: '🧿',
      price: 50,
      isKey: true,
      typeColor: 'text-amber-900 border-amber-400 bg-amber-100',
    },
    {
      id: 'fruto_alerce',
      name: 'Fruto de Maqui Dorado',
      category: '+1 Nivel · Clave',
      description: 'Fruto sagrado de alto valor. Sube +1 Nivel al instante a cualquier Criatura Espiritual.',
      icon: '🍇',
      price: 550,
      isKey: true,
      typeColor: 'text-amber-900 border-amber-400 bg-amber-100',
    },
    {
      id: 'esencia_pewen',
      name: 'Resina de Pewén',
      category: 'Evolución · Clave',
      description: 'Catalizador para evolucionar Criaturas Espirituales de Planta/Tierra en el Santuario.',
      icon: '🌿',
      price: 180,
      isKey: true,
      typeColor: 'text-amber-900 border-amber-400 bg-amber-100',
    },
    {
      id: 'corazon_basalto',
      name: 'Corazón de Basalto',
      category: 'Evolución · Clave',
      description: 'Piedra volcánica que despierta las evoluciones de Fuego y Prehistoria.',
      icon: '🔥',
      price: 180,
      isKey: true,
      typeColor: 'text-amber-900 border-amber-400 bg-amber-100',
    },
    {
      id: 'cristal_hielo',
      name: 'Cristal de Hielo Azul',
      category: 'Evolución · Clave',
      description: 'Gema tallada en ventisqueros para evoluciones de Hielo y Austral.',
      icon: '❄️',
      price: 180,
      isKey: true,
      typeColor: 'text-amber-900 border-amber-400 bg-amber-100',
    },
  ];

  const sellableItems = Object.values(inventory).filter(item => item.count > 0);
  const getSellPrice = (itemId: string) => {
    const match = shopCatalog.find(c => c.id === itemId);
    return Math.max(10, Math.round((match?.price || 40) * 0.5));
  };

  const selectedItem = shopCatalog.find(i => i.id === selectedItemId) || shopCatalog[0];
  const selectedSellItem =
    inventory[selectedItemId] && inventory[selectedItemId].count > 0
      ? inventory[selectedItemId]
      : sellableItems[0];

  const currentCount = inventory[selectedItem.id]?.count || 0;
  const canAfford1 = barbara.gold >= selectedItem.price;
  const canAfford3 = barbara.gold >= selectedItem.price * 3;

  const handleBuy = (qty: number) => {
    const totalCost = selectedItem.price * qty;
    if (barbara.gold < totalCost) {
      sound.playCancel();
      return;
    }
    sound.playConfirm();
    onBuyItem(selectedItem.id, qty, totalCost);
    setPurchaseSuccessMessage(`¡Compraste ${qty}x ${selectedItem.name}!`);
    setTimeout(() => setPurchaseSuccessMessage(null), 2500);
  };

  const handleSell = (qty: number) => {
    if (!selectedSellItem || !onSellItem || selectedSellItem.count < qty) {
      sound.playCancel();
      return;
    }
    const unitPrice = getSellPrice(selectedSellItem.id);
    const earned = unitPrice * qty;
    sound.playConfirm();
    onSellItem(selectedSellItem.id, qty, earned);
    setPurchaseSuccessMessage(`¡Vendiste ${qty}x ${selectedSellItem.name} por ${earned} Oro!`);
    setTimeout(() => setPurchaseSuccessMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-5 md:p-6 text-[#1E2022] font-ui animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-3 sm:pb-4 border-b border-stone-300">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-2 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-silkscreen font-bold active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>SALIR</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-[#1E2022] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#1E2022] shrink-0" />
              <span className="truncate">{vendorName.toUpperCase()}</span>
            </h2>
            <p className="text-[11px] text-stone-600 font-mono-stat hidden sm:block">
              {regionLabel} · Compra y vende pociones, maná, comida para revivir y amuletos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex bg-[#F4F4F2] border border-stone-300 p-1 rounded-xl text-[11px] font-silkscreen">
            <button
              onClick={() => {
                sound.playSelect();
                setShopTab('buy');
                setSelectedItemId('matico');
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                shopTab === 'buy' ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow-sm' : 'text-stone-600 hover:text-[#1E2022]'
              }`}
            >
              COMPRAR
            </button>
            <button
              onClick={() => {
                sound.playSelect();
                setShopTab('sell');
                if (sellableItems[0]) setSelectedItemId(sellableItems[0].id);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                shopTab === 'sell' ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow-sm' : 'text-stone-600 hover:text-[#1E2022]'
              }`}
            >
              VENDER
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F4F2] border-2 border-stone-300 rounded-xl shadow-sm">
            <Coins className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono-stat text-stone-600 leading-none">Oro</span>
              <span className="font-silkscreen text-xs text-[#1E2022] font-bold tabular-nums">{barbara.gold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      {shopTab === 'buy' ? (
        <div className="max-w-5xl w-full mx-auto my-3 sm:my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-7 bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-3 sm:p-4 flex flex-col gap-2 max-h-[320px] lg:max-h-[480px] overflow-y-auto shadow-md">
            <div className="text-[10px] sm:text-[11px] font-silkscreen text-stone-600 mb-1 px-2 flex justify-between">
              <span>PROVISIÓN DISPONIBLE</span>
              <span>PRECIO</span>
            </div>

            {shopCatalog.map(item => {
              const isSelected = item.id === selectedItemId;
              const inBag = inventory[item.id]?.count || 0;
              const affordable = barbara.gold >= item.price;
              const isKey = Boolean((item as { isKey?: boolean }).isKey);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedItemId(item.id);
                  }}
                  className={`min-h-[60px] p-2.5 sm:p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? isKey
                        ? 'bg-amber-50 border-amber-500 text-[#1E2022] shadow-md'
                        : 'bg-white border-[#1E2022] text-[#1E2022] shadow-md'
                      : isKey
                      ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-300 text-[#1E2022]'
                      : 'bg-[#E7E7E2] hover:bg-white border-stone-300 text-[#1E2022]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-white border border-stone-300 rounded-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className={`font-silkscreen text-[11px] sm:text-xs flex flex-wrap items-center gap-1.5 ${isKey ? 'text-amber-900 font-bold' : 'text-[#1E2022] font-bold'}`}>
                        <span className="truncate">{item.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono-stat border ${item.typeColor}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono-stat mt-0.5 text-stone-600">
                        En mochila: <span className="font-bold text-[#1E2022]">{inBag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-silkscreen text-xs shrink-0 pl-2 tabular-nums">
                    <Coins className={`w-3.5 h-3.5 ${!affordable ? 'text-red-600' : 'text-amber-700'}`} />
                    <span className={!affordable ? 'text-red-700 font-bold' : 'text-[#1E2022] font-bold'}>
                      {item.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-md flex-1">
              <div className="flex items-center gap-3 border-b border-stone-300 pb-3">
                <span className="text-3xl sm:text-4xl p-2.5 sm:p-3 bg-[#E7E7E2] border border-stone-300 rounded-2xl shadow-inner">
                  {selectedItem.icon}
                </span>
                <div>
                  <h3 className="font-silkscreen text-xs sm:text-sm text-[#1E2022]">{selectedItem.name}</h3>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono-stat border ${selectedItem.typeColor}`}>
                    {selectedItem.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed font-ui bg-[#E7E7E2] p-3 rounded-2xl border border-stone-300">
                {selectedItem.description}
              </p>

              {purchaseSuccessMessage && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-xs font-silkscreen text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{purchaseSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-1.5 mt-auto">
                <div className="flex justify-between items-center text-xs font-mono-stat text-stone-600">
                  <span>En tu mochila:</span>
                  <span className="text-[#1E2022] font-bold tabular-nums">{currentCount} unidades</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono-stat text-stone-600">
                  <span>Saldo disponible:</span>
                  <span className={`font-bold tabular-nums ${canAfford1 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {barbara.gold} Oro
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  disabled={!canAfford1}
                  onClick={() => handleBuy(1)}
                  className="min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:text-stone-500 text-white font-silkscreen font-bold text-xs rounded-2xl cursor-pointer disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-95"
                >
                  <span>COMPRAR 1x</span>
                  <span className="text-[10px] font-mono-stat opacity-90 tabular-nums">({selectedItem.price} Oro)</span>
                </button>

                <button
                  disabled={!canAfford3}
                  onClick={() => handleBuy(3)}
                  className="min-h-[48px] py-3 bg-[#1E2022] hover:bg-zinc-800 disabled:bg-stone-300 disabled:text-stone-500 text-[#F4F4F2] font-silkscreen font-bold text-xs rounded-2xl cursor-pointer disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-95"
                >
                  <span>COMPRAR 3x</span>
                  <span className="text-[10px] font-mono-stat opacity-90 tabular-nums">({selectedItem.price * 3} Oro)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl w-full mx-auto my-3 sm:my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-7 bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-3 sm:p-4 flex flex-col gap-2 max-h-[320px] lg:max-h-[480px] overflow-y-auto shadow-md">
            <div className="text-[10px] sm:text-[11px] font-silkscreen text-stone-600 mb-1 px-2 flex justify-between">
              <span>OBJETOS EN MOCHILA</span>
              <span>VALOR COMPRA</span>
            </div>

            {sellableItems.length === 0 ? (
              <div className="p-8 text-center text-stone-600 font-mono text-xs">
                No tienes objetos disponibles para vender en tu mochila.
              </div>
            ) : (
              sellableItems.map(item => {
                const isSelected = selectedSellItem?.id === item.id;
                const sellVal = getSellPrice(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playSelect();
                      setSelectedItemId(item.id);
                    }}
                    className={`min-h-[56px] p-2.5 sm:p-3 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-white border-[#1E2022] text-[#1E2022] shadow-md'
                        : 'bg-[#E7E7E2] hover:bg-white border-stone-300 text-[#1E2022]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-white border border-stone-300 rounded-xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className="font-silkscreen text-[11px] sm:text-xs truncate text-[#1E2022] font-bold">{item.name}</div>
                        <div className="text-[10px] sm:text-[11px] font-mono-stat text-stone-600">
                          Cantidad: <span className="font-bold text-[#1E2022]">x{item.count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-silkscreen text-xs shrink-0 pl-2 text-emerald-700 font-bold tabular-nums">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{sellVal}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {selectedSellItem ? (
              <div className="bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-md flex-1">
                <div className="flex items-center gap-3 border-b border-stone-300 pb-3">
                  <span className="text-3xl sm:text-4xl p-2.5 sm:p-3 bg-[#E7E7E2] border border-stone-300 rounded-2xl shadow-inner">
                    {selectedSellItem.icon}
                  </span>
                  <div>
                    <h3 className="font-silkscreen text-xs sm:text-sm text-[#1E2022]">{selectedSellItem.name}</h3>
                    <span className="text-[10px] font-mono-stat text-stone-600 uppercase font-bold">{selectedSellItem.category}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed font-ui bg-[#E7E7E2] p-3 rounded-2xl border border-stone-300">
                  {selectedSellItem.description}
                </p>

                {purchaseSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-xs font-silkscreen text-emerald-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{purchaseSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5 mt-auto">
                  <div className="flex justify-between items-center text-xs font-mono-stat text-stone-600">
                    <span>Disponibles para vender:</span>
                    <span className="text-[#1E2022] font-bold tabular-nums">{selectedSellItem.count} unidades</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono-stat text-stone-600">
                    <span>Oferta de compra:</span>
                    <span className="text-emerald-700 font-bold tabular-nums">{getSellPrice(selectedSellItem.id)} Oro c/u</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    disabled={selectedSellItem.count < 1 || !onSellItem}
                    onClick={() => handleSell(1)}
                    className="min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:text-stone-500 text-white font-silkscreen font-bold text-xs rounded-2xl cursor-pointer disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-95"
                  >
                    <span>VENDER 1x</span>
                    <span className="text-[10px] font-mono-stat opacity-90 tabular-nums">
                      (+{getSellPrice(selectedSellItem.id)} Oro)
                    </span>
                  </button>

                  <button
                    disabled={selectedSellItem.count < 2 || !onSellItem}
                    onClick={() => handleSell(selectedSellItem.count)}
                    className="min-h-[48px] py-3 bg-[#1E2022] hover:bg-zinc-800 disabled:bg-stone-300 disabled:text-stone-500 text-[#F4F4F2] font-silkscreen font-bold text-xs rounded-2xl cursor-pointer disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center gap-0.5 active:scale-95"
                  >
                    <span>VENDER TODO</span>
                    <span className="text-[10px] font-mono-stat opacity-90 tabular-nums">
                      (+{getSellPrice(selectedSellItem.id) * selectedSellItem.count} Oro)
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-6 flex items-center justify-center text-stone-600 font-mono text-xs flex-1">
                Selecciona un objeto de tu mochila.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-3 border-t border-stone-300 text-center text-[11px] font-mono-stat text-stone-600">
        Tiendas interiores disponibles en Escenario 1 (R. Metropolitana), Escenario 3 (R. Araucanía) y Escenario 5 (R. Los Lagos).
      </div>
    </div>
  );
};
