/** Le flux temps réel est-il ouvert ? Les requêtes « en direct » ralentissent alors leur sondage. */
let connected = false;

export const setRealtimeConnected = (value: boolean) => {
  connected = value;
};

export const isRealtimeConnected = () => connected;
