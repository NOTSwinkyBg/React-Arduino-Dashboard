import React, { useState, useEffect } from 'react';

interface LedProps {
  label: string;
  isOn: boolean;
  color: 'red' | 'green' | 'blue' | 'yellow';
}

const LedIndicator: React.FC<LedProps> = ({ label, isOn, color }) => {
  const colorMap = {
    red: { on: 'bg-red-500 shadow-red-500/50', off: 'bg-red-900/30' },
    green: { on: 'bg-green-500 shadow-green-500/50', off: 'bg-green-900/30' },
    blue: { on: 'bg-blue-500 shadow-blue-500/50', off: 'bg-blue-900/30' },
    yellow: { on: 'bg-yellow-400 shadow-yellow-400/50', off: 'bg-yellow-900/30' },
  };

  const activeClass = isOn ? `shadow-[0_0_20px_2px] ${colorMap[color].on}` : colorMap[color].off;

  return (
    <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl border border-gray-700">
      <div className={`w-12 h-12 rounded-full transition-all duration-300 ${activeClass} border-2 border-gray-600 mb-3`}></div>
      <span className="text-gray-300 font-bold uppercase text-xs tracking-wider">{label}</span>
      <span className={`text-xs mt-1 ${isOn ? 'text-white' : 'text-gray-500'}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
};

interface PotProps {
  label: string;
  value: number; // 0 - 100
}

const PotentiometerGauge: React.FC<PotProps> = ({ label, value }) => {
  return (
    <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 w-full">
      <div className="flex justify-between mb-2">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>

      <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
        <div 
          className="h-full bg-linear-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      
      <div className="mt-4 flex justify-center">
         <div className="relative w-16 h-16 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center shadow-inner">
            <div 
                className="w-1 h-6 bg-cyan-400 absolute top-1 origin-bottom transition-transform duration-500"
                style={{ transform: `rotate(${(value * 2.7) - 135}deg)` }} // От -135 до +135 градуса
            ></div>
         </div>
      </div>
    </div>
  );
};

interface SensorProps {
  icon: string;
  label: string;
  value: number | string;
  unit: string;
  trend?: 'up' | 'down' | 'stable'; 
}

const SensorCard: React.FC<SensorProps> = ({ icon, label, value, unit, trend }) => {
  return (
    <div className="flex items-center p-6 bg-gray-800 rounded-2xl border border-gray-600 shadow-lg hover:border-gray-500 transition-colors">
      <div className="text-4xl mr-5 bg-gray-700 w-16 h-16 flex items-center justify-center rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm uppercase font-semibold">{label}</p>
        <div className="flex items-end">
            <h3 className="text-3xl font-extrabold text-white leading-none">
                {typeof value === 'number' ? value.toFixed(1) : value}
            </h3>
            <span className="text-gray-500 ml-1 mb-1 font-bold">{unit}</span>
        </div>
        {trend && (
            <p className={`text-xs mt-1 ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                {trend === 'up' ? '▲ Покачва се' : '▼ Спада'}
            </p>
        )}
      </div>
    </div>
  );
};

export default function ArduinoDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [arduinoData, setArduinoData] = useState({
    pot: 0,
    btn: 0,
    temp: 0
  })

  const connectToSerial = async () =>{
    if(!("serial" in navigator)){
      alert("Вашият браузър няма Web Serial API. Ползвайте Chrome или Edge.");
      return;
    }

    try {
      //@ts-ignore
      const port = await navigator.serial.requestPort();

      await port.open({baudRate: 9600});
      setIsConnected(true);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      try {
        while (true) {
          const {value, done} = await reader.read();
          if(done) break;

          if(value) {
            buffer += value;
            const lines = buffer.split('\r\n');
            buffer = lines.pop() || "" 

            for(const line of lines) {
              if(line.trim().startsWith('{') && line.trim().endsWith('}')) {
                try{
                  const parsedData = JSON.parse(line);

                  setArduinoData(parsedData);
                } catch (e) {
                  console.log("Грешка при парсване (Ingnored): ", e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("Грешка при четене: ", error);
      } finally {
        reader.releaseLock()
      }
      
    } catch (err) {
      console.log("Грешка при свързване", err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      
      <header className="mb-10 flex justify-between items-center border-b border-gray-700 pb-4">
        <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-600">
            ARDUINO DASHBOARD v1.0
            </h1>
            <p className="text-gray-500 text-sm mt-1">Status: <span className="text-green-400 animate-pulse">● Connected</span></p>
        </div>
        <div className="text-right hidden md:block">
            {!isConnected && (
              <button
                onClick={connectToSerial}
                className='bg-blue-600 hover:bg-blue-700'
              >Свържи устройство</button>
            )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        
        <section>
            <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                Входни данни
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PotentiometerGauge label='Потензиометър (А0)' value={arduinoData.pot}/>
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                Цифрови Входове
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LedIndicator label='Физически бутон (D2)' isOn={arduinoData.btn === 1} color='blue'/>
              <LedIndicator label='Виртуален' isOn={arduinoData.pot > 80} color='red'/>
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                Сензорна симулация
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SensorCard icon="🌡" label='Температура' value={arduinoData.temp.toFixed(1)} unit='c'/>
            </div>
        </section>

      </main>
    </div>
  );
}