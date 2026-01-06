import React from 'react';
import { Droplet, CheckCircle } from 'lucide-react';

const calculatePercentage = (current, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
};

export const WATER_CUP_SIZE_ML = 250;

export default function WaterTracker({ waterData = {}, logWater = () => {} }) {
  const MAX_WATER_CUPS = Math.ceil((waterData.dailyWaterGoalMl || 2500) / WATER_CUP_SIZE_ML);
  const waterCupsFilled = Math.floor((waterData.currentWaterMl || 0) / WATER_CUP_SIZE_ML);

  const handleGlassClick = (cupIndex) => {
    const currentWaterMl = waterData.currentWaterMl || 0;
    const currentCups = Math.floor(currentWaterMl / WATER_CUP_SIZE_ML);
    let newCups;
    if (cupIndex + 1 === currentCups) newCups = currentCups - 1;
    else newCups = cupIndex + 1;
    newCups = Math.max(0, newCups);
    const newTotalWaterMl = newCups * WATER_CUP_SIZE_ML;
    const amountToLog = newTotalWaterMl - currentWaterMl;
    if (amountToLog !== 0) logWater(amountToLog);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Droplet size={20} className="text-blue-600" />
        </div>
        <h3 className="font-bold text-lg text-slate-800">Hydration</h3>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-4">
        {[...Array(MAX_WATER_CUPS)].map((_, index) => (
          <div key={index} className="aspect-3/4 border-2 border-blue-200 rounded-b-xl relative cursor-pointer transition-all duration-300 hover:scale-110 overflow-hidden bg-slate-50" onClick={() => handleGlassClick(index)}>
            <div className={`absolute bottom-0 w-full bg-blue-400 transition-all duration-700 ease-in-out`} style={{ height: index < waterCupsFilled ? '100%' : '0%' }}></div>
            {index < waterCupsFilled && <CheckCircle size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-end mb-3">
        <span className="text-sm font-bold text-blue-600">Progress</span>
        <span className="text-sm text-slate-400 font-medium">
          {waterData.currentWaterMl || 0} / {waterData.dailyWaterGoalMl || 2500} ml
        </span>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div className="h-3 bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${calculatePercentage(waterData.currentWaterMl || 0, waterData.dailyWaterGoalMl || 2500)}%` }}></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[250,500,750].map((amount) => (
          <button key={amount} onClick={() => logWater(amount)} className="py-2 text-sm font-bold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
            +{amount}ml
          </button>
        ))}
      </div>
    </div>
  );
}
