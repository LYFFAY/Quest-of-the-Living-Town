const params = new URLSearchParams(location.search);
const run = params.get('run');
const embedded = parent !== window && params.get('story') === '1' &&
  params.get('episode') === 'raft' && !!run;

function send(type) {
  if (embedded) parent.postMessage({type, episode:'raft', run}, location.origin);
}

export function connectActivity(stop) {
  if (!embedded) return;
  addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin &&
        event.data?.type === 'wuzhong-stop' && event.data.run === run) stop();
  });
  send('wuzhong-ready');
}

export function enterInteraction() {
  location.assign('./interaction-v2.html' + (embedded ? location.search : ''));
}

export function completeActivity() {
  send('wuzhong-complete');
}
