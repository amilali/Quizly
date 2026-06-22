import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseGameSocketOptions {
  pin: string | null;
  playerName: string | null;
  onMessage: (message: any) => void;
  onPersonalMessage?: (message: any) => void;
}

export function useGameSocket({ pin, playerName, onMessage, onPersonalMessage }: UseGameSocketOptions) {
  const clientRef = useRef<Client | null>(null);

  const sendAnswer = useCallback((questionId: number | string, selectedOption: number) => {
    if (!clientRef.current?.connected || !pin || !playerName) return;
    clientRef.current.publish({
      destination: '/app/game/answer',
      body: JSON.stringify({ pin, playerName, questionId, selectedOption }),
    });
  }, [pin, playerName]);

  useEffect(() => {
    if (!pin) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to the game's broadcast channel
        client.subscribe(`/topic/game/${pin}/events`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            onMessage(data);
          } catch (e) {
            console.error('Failed to parse game message', e);
          }
        });

        // Subscribe to personal channel for answer results
        if (playerName && onPersonalMessage) {
          client.subscribe(`/topic/game/${pin}/player/${playerName}`, (frame) => {
            try {
              const data = JSON.parse(frame.body);
              onPersonalMessage(data);
            } catch (e) {
              console.error('Failed to parse personal message', e);
            }
          });
        }

        // Register session for disconnect tracking
        if (playerName) {
          client.publish({
            destination: '/app/game/connect',
            body: JSON.stringify({ pin, playerName }),
          });
        }
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [pin, playerName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { sendAnswer };
}
