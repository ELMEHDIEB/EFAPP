import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '../components/ui/ToastContext.jsx';
import { exportDbToJson, importJsonToDb } from '../lib/syncUtils.js';
import HeroHeader from '../components/ui/HeroHeader.jsx';

export default function SyncCenter() {
  const toast = useToast();
  const [mode, setMode] = useState(null); // 'send' or 'receive'
  const [peerId, setPeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, syncing, done
  const peerInstance = useRef(null);
  const connInstance = useRef(null);

  // --- SEND MODE ---
  const startHost = () => {
    setMode('send');
    setConnectionStatus('connecting');
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setConnectionStatus('connected'); // Ready to be scanned
    });

    peer.on('connection', (conn) => {
      connInstance.current = conn;
      toast("Un appareil s'est connecté !", "success");
      
      conn.on('open', async () => {
        setConnectionStatus('syncing');
        try {
          const dataPayload = await exportDbToJson();
          conn.send(dataPayload);
          setConnectionStatus('done');
          toast("Données envoyées avec succès !", "success");
        } catch (e) {
          toast("Erreur lors de l'envoi", "danger");
          setConnectionStatus('error');
        }
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      toast("Erreur réseau P2P", "danger");
    });
  };

  // --- RECEIVE MODE ---
  const startClient = () => {
    setMode('receive');
  };

  useEffect(() => {
    if (mode === 'receive' && connectionStatus === 'disconnected') {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      
      scanner.render((decodedText) => {
        scanner.clear();
        connectToHost(decodedText);
      }, (error) => {
        // ignore scan errors (they happen every frame)
      });

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [mode, connectionStatus]);

  const connectToHost = (hostId) => {
    setConnectionStatus('connecting');
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(hostId);
      connInstance.current = conn;

      conn.on('open', () => {
        setConnectionStatus('syncing');
        toast("Connecté au PC ! Réception en cours...", "info");
      });

      conn.on('data', async (data) => {
        try {
          await importJsonToDb(data);
          setConnectionStatus('done');
          toast("Synchronisation réussie ! Rechargement...", "success");
          setTimeout(() => window.location.reload(), 2000);
        } catch (e) {
          toast("Données corrompues ou incompatibles", "danger");
          setConnectionStatus('error');
        }
      });
    });

    peer.on('error', (err) => {
      toast("Impossible de se connecter au code QR", "danger");
      setConnectionStatus('disconnected');
    });
  };

  // --- CLEANUP ---
  useEffect(() => {
    return () => {
      if (connInstance.current) connInstance.current.close();
      if (peerInstance.current) peerInstance.current.destroy();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      <HeroHeader 
        title="Sync Center"
        description="Transfert direct P2P de vos données entre vos appareils (Zéro Cloud)."
      />

      {!mode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={startHost} className="pro-card bg-surface p-8 flex flex-col items-center gap-4 hover:border-blue-500/50 transition-colors">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Envoyer mes données</h3>
            <p className="text-textdim text-center text-sm">Générez un QR Code depuis cet appareil pour transférer la sauvegarde vers votre téléphone.</p>
          </button>

          <button onClick={startClient} className="pro-card bg-surface p-8 flex flex-col items-center gap-4 hover:border-green-500/50 transition-colors">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white">Recevoir des données</h3>
            <p className="text-textdim text-center text-sm">Ouvrez la caméra de cet appareil pour scanner un QR Code et importer les données.</p>
          </button>
        </div>
      )}

      {mode === 'send' && (
        <div className="pro-card bg-surface p-8 flex flex-col items-center justify-center text-center space-y-6">
          <h3 className="text-2xl font-bold text-white">Scanner ce QR Code</h3>
          <p className="text-textdim max-w-md">Ouvrez l'application sur votre téléphone, allez dans "Sync Center" et choisissez "Recevoir des données".</p>
          
          <div className="bg-white p-4 rounded-xl">
            {peerId ? (
              <QRCodeSVG value={peerId} size={256} />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="text-sm font-mono text-textmuted">ID: {peerId || 'Génération...'}</div>

          {connectionStatus === 'syncing' && <p className="text-blue-400 font-bold animate-pulse">Envoi en cours...</p>}
          {connectionStatus === 'done' && <p className="text-green-400 font-bold">Synchronisation terminée !</p>}
          
          <button onClick={() => setMode(null)} className="btn-secondary mt-8">Annuler</button>
        </div>
      )}

      {mode === 'receive' && (
        <div className="pro-card bg-surface p-8 flex flex-col items-center justify-center text-center space-y-6">
          <h3 className="text-2xl font-bold text-white">En attente du scan...</h3>
          <p className="text-textdim max-w-md">Visez le QR code affiché sur l'autre appareil.</p>
          
          {connectionStatus === 'disconnected' && (
            <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-white/10"></div>
          )}

          {connectionStatus === 'connecting' && <p className="text-orange-400 font-bold animate-pulse">Connexion à l'hôte...</p>}
          {connectionStatus === 'syncing' && <p className="text-blue-400 font-bold animate-pulse">Réception en cours...</p>}
          {connectionStatus === 'done' && <p className="text-green-400 font-bold">Importation terminée !</p>}

          <button onClick={() => setMode(null)} className="btn-secondary mt-8">Annuler</button>
        </div>
      )}
    </div>
  );
}
