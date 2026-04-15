import { Video, Mic, MicOff, VideoOff, Phone, MessageCircle, Paperclip, Send } from 'lucide-react';
import { useState } from 'react';

export function PatientTeleconsult() {
  const [messages, setMessages] = useState([
    { sender: 'doctor', text: 'Hola María, ¿cómo te encuentras hoy?', time: '10:01' },
    { sender: 'patient', text: 'Hola doctor, me siento mejor pero aún tengo algo de presión alta.', time: '10:02' },
  ]);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-4">
      {/* Video Call Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Video */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden relative">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4">
                DR
              </div>
              <p className="text-white text-xl font-bold">Dr. Carlos Ramírez</p>
              <p className="text-gray-400">Cardiología</p>
            </div>
          </div>

          {/* Own Video Preview */}
          <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl font-bold">
                MG
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
              <Mic className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white">
              <Video className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white">
              <Phone className="w-5 h-5" />
            </button>
          </div>

          {/* Timer */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white font-mono">
            25:34
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Chat en Vivo</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.sender === 'patient' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'patient' ? 'text-blue-200' : 'text-gray-500'}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Paperclip className="w-5 h-5 text-gray-600" />
              </button>
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Médico</p>
            <p className="font-bold text-gray-900">Dr. Carlos Ramírez</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Especialidad</p>
            <p className="font-bold text-gray-900">Cardiología</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-bold text-gray-900">26 de Marzo, 2026</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Hora</p>
            <p className="font-bold text-gray-900">10:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
