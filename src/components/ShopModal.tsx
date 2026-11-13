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
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'gota_termal',
      name: 'Gota Termal de Pucón',
      category: 'Maná (PM)',
      description: 'Agua mineral caliente con sales termales. Restaura 50 PM de energía táctica.',
      icon: '💧',
      price: 45,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'empanada',
      name: 'Empanada de Horno',
      category: 'Revivir',
      description: 'Nutritivo banquete tradicional. Revive a un aliado caído con 50% de PS.',
      icon: '🥟',
      price: 90,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'infusion_calafate',
      name: 'Infusión de Calafate',
      category: 'Cura Total',
      description: 'Brebaje de bayas silvestres. Restaura 150 PS y sana estados negativos.',
      icon: '🫐',
      price: 65,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'orbe_resonancia',
      name: 'Amuleto de Vínculo Pewén',
      category: 'Vínculo',
      description: 'Amuleto tallado en madera fósil andina para vincular y reclutar espíritus.',
      icon: '🧿',
      price: 50,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'esencia_pewen',
      name: 'Resina de Pewén',
      category: 'Evolución',
      description: 'Catalizador para evolucionar espíritus de Planta/Tierra en el Santuario.',
      icon: '🌿',
      price: 180,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'corazon_basalto',
      name: 'Corazón de Basalto',
      category: 'Evolución',
      description: 'Piedra volcánica que despierta las evoluciones de Fuego y Prehistoria.',
      icon: '🔥',
      price: 180,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
    },
    {
      id: 'cristal_hielo',
      name: 'Cristal de Hielo Azul',
      category: 'Evolución',
      description: 'Gema tallada en ventisqueros para evoluciones de Hielo y Austral.',
      icon: '❄️',
      price: 180,
      typeColor: 'text-zinc-200 border-zinc-600 bg-zinc-800',
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
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-5 md:p-6 text-zinc-100 font-ui animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-3 sm:pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-silkscreen active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>SALIR</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-zinc-200 shrink-0" />
              <span className="truncate">{vendorName.toUpperCase()}</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono-stat hidden sm:block">
              {regionLabel} · Compra y vende pociones, maná, comida para revivir y amuletos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex bg-zinc-900 border border-zinc-700 p-1 rounded-xl text-[11px] font-silkscreen">
            <button
              onClick={() => {
                sound.playSelect();
                setShopTab('buy');
                setSelectedItemId('matico');
              }}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                shopTab === 'buy' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
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
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                shopTab === 'sell' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              VENDER
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded-xl shadow-lg">
            <Coins className="w-4 h-4 text-zinc-200 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono-stat text-zinc-400 leading-none">Oro</span>
              <span className="font-silkscreen text-xs text-zinc-100 font-bold">{barbara.gold}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      {shopTab === 'buy' ? (
        <div className="max-w-5xl w-full mx-auto my-3 sm:my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-7 bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-3 sm:p-4 flex flex-col gap-2 max-h-[300px] lg:max-h-[480px] overflow-y-auto shadow-2xl">
            <div className="text-[10px] sm:text-[11px] font-silkscreen text-zinc-400 mb-1 px-2 flex justify-between">
              <span>PROVISIÓN DISPONIBLE</span>
              <span>PRECIO</span>
            </div>

            {shopCatalog.map(item => {
              const isSelected = item.id === selectedItemId;
              const inBag = inventory[item.id]?.count || 0;
              const affordable = barbara.gold >= item.price;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedItemId(item.id);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 border-white shadow-lg'
                      : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-zinc-900 border border-zinc-700 rounded-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className={`font-silkscreen text-[11px] sm:text-xs flex flex-wrap items-center gap-1.5 ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-100'}`}>
                        <span className="truncate">{item.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono-stat border ${isSelected ? 'bg-zinc-900 text-zinc-100 border-zinc-800' : item.typeColor}`}>
                          {item.category}
                        </span>
                      </div>
                      <div className={`text-[10px] sm:text-[11px] font-mono-stat mt-0.5 ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        En mochila: <span className="font-bold">{inBag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-silkscreen text-xs shrink-0 pl-2">
                    <Coins className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-900' : 'text-zinc-300'}`} />
                    <span className={!affordable && !isSelected ? 'text-zinc-600' : 'font-bold'}>
                      {item.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-xl flex-1">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <span className="text-3xl sm:text-4xl p-2.5 sm:p-3 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-inner">
                  {selectedItem.icon}
                </span>
                <div>
                  <h3 className="font-silkscreen text-xs sm:text-sm text-zinc-100">{selectedItem.name}</h3>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono-stat border ${selectedItem.typeColor}`}>
                    {selectedItem.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed font-ui bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                {selectedItem.description}
              </p>

              {purchaseSuccessMessage && (
                <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-2xl text-xs font-silkscreen text-zinc-950 flex items-center gap-2">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>{purchaseSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-1.5 mt-auto">
                <div className="flex justify-between items-center text-xs font-mono-stat text-zinc-400">
                  <span>En tu mochila:</span>
                  <span className="text-zinc-100 font-bold">{currentCount} unidades</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono-stat text-zinc-400">
                  <span>Saldo disponible:</span>
                  <span className="text-zinc-100 font-bold">{barbara.gold} Oro</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  disabled={!canAfford1}
                  onClick={() => handleBuy(1)}
                  className="py-3 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 font-silkscreen font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center gap-1 border border-zinc-300 active:scale-95"
                >
                  <span>COMPRAR 1x</span>
                  <span className="text-[10px] font-mono-stat text-zinc-700 font-bold">({selectedItem.price} Oro)</span>
                </button>

                <button
                  disabled={!canAfford3}
                  onClick={() => handleBuy(3)}
                  className="py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-100 font-silkscreen font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center gap-1 border border-zinc-500 active:scale-95"
                >
                  <span>COMPRAR 3x</span>
                  <span className="text-[10px] font-mono-stat text-zinc-300 font-bold">({selectedItem.price * 3} Oro)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl w-full mx-auto my-3 sm:my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-7 bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-3 sm:p-4 flex flex-col gap-2 max-h-[300px] lg:max-h-[480px] overflow-y-auto shadow-2xl">
            <div className="text-[10px] sm:text-[11px] font-silkscreen text-zinc-400 mb-1 px-2 flex justify-between">
              <span>OBJETOS EN MOCHILA</span>
              <span>VALOR COMPRA</span>
            </div>

            {sellableItems.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">
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
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white shadow-lg'
                        : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl sm:text-2xl p-1.5 sm:p-2 bg-zinc-900 border border-zinc-700 rounded-xl shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <div className={`font-silkscreen text-[11px] sm:text-xs truncate ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-100'}`}>{item.name}</div>
                        <div className={`text-[10px] sm:text-[11px] font-mono-stat ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          Cantidad: <span className="font-bold">x{item.count}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-silkscreen text-xs shrink-0 pl-2">
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
              <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 shadow-xl flex-1">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                  <span className="text-3xl sm:text-4xl p-2.5 sm:p-3 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-inner">
                    {selectedSellItem.icon}
                  </span>
                  <div>
                    <h3 className="font-silkscreen text-xs sm:text-sm text-zinc-100">{selectedSellItem.name}</h3>
                    <span className="text-[10px] font-mono-stat text-zinc-400 uppercase">{selectedSellItem.category}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-ui bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  {selectedSellItem.description}
                </p>

                {purchaseSuccessMessage && (
                  <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-2xl text-xs font-silkscreen text-zinc-950 flex items-center gap-2">
                    <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                    <span>{purchaseSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5 mt-auto">
                  <div className="flex justify-between items-center text-xs font-mono-stat text-zinc-400">
                    <span>Disponibles para vender:</span>
                    <span className="text-zinc-100 font-bold">{selectedSellItem.count} unidades</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono-stat text-zinc-400">
                    <span>Oferta de compra:</span>
                    <span className="text-zinc-100 font-bold">{getSellPrice(selectedSellItem.id)} Oro c/u</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    disabled={selectedSellItem.count < 1 || !onSellItem}
                    onClick={() => handleSell(1)}
                    className="py-3 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 font-silkscreen font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center gap-1 border border-zinc-300 active:scale-95"
                  >
                    <span>VENDER 1x</span>
                    <span className="text-[10px] font-mono-stat text-zinc-700 font-bold">
                      (+{getSellPrice(selectedSellItem.id)} Oro)
                    </span>
                  </button>

                  <button
                    disabled={selectedSellItem.count < 2 || !onSellItem}
                    onClick={() => handleSell(selectedSellItem.count)}
                    className="py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-zinc-100 font-silkscreen font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-lg flex flex-col items-center justify-center gap-1 border border-zinc-500 active:scale-95"
                  >
                    <span>VENDER TODO</span>
                    <span className="text-[10px] font-mono-stat text-zinc-300 font-bold">
                      (+{getSellPrice(selectedSellItem.id) * selectedSellItem.count} Oro)
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 flex items-center justify-center text-zinc-500 font-mono text-xs flex-1">
                Selecciona un objeto de tu mochila.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono-stat text-zinc-500">
        Comercios disponibles físicamente en Escenario 1 (RM), Escenario 3 (La Araucanía) y Escenario 5 (Los Lagos).
      </div>
    </div>
  );
};
