import playFn from '../utils/playFn.js';

export default {
  name: 'playnext',
  description: 'Queues a song to be played next, after the current song finishes.',
  options: [
    {
      name: 'query',
      type: 3, // 'STRING' Type
      description: 'The song you want to play',
      required: true,
    },
  ],
  execute: playFn({ shouldPlayNext: true })
};
