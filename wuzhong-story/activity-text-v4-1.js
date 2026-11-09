const english = {
  '开始互动':'Start activity',
  '重试':'Try again',
  '重新开启摄像头':'Restart camera',
  'AR扫描窗口':'AR scanning window',
  '文物互动':'Artefact activity',
  '银槎杯AR扫描':'AR scan for the silver raft cup',
  '正在识别…':'Scanning…',
  '正在开启摄像头…':'Starting camera…',
  '正在准备识别…':'Preparing to scan…',
  '请对准识别图片':'Point the camera at the target image',
  '请对准银槎杯识别图':'Point the camera at the silver raft cup target',
  '识别成功':'Target found',
  '已识别，可开始互动':'Target found. You can start the activity.',
  'AR暂时无法开启':'AR could not start',
  '摄像头未开启':'Camera unavailable',
  '请在 HTTPS 页面允许摄像头访问后重试。':'Allow camera access on the HTTPS page, then try again.',
  '摄像头未开启，仍可体验补纹。请通过HTTPS打开，并允许摄像头。':'The camera is unavailable. Allow camera access over HTTPS to use the camera view.',
  '请通过HTTPS打开并允许摄像头。摄像头未开启时，仍可体验互动。':'The activity is available without the camera. To use the camera view, open over HTTPS and allow camera access.',
  '滑动查看不同角度，手机双指缩放，电脑滚轮缩放':'Drag to rotate. Pinch on mobile or scroll on desktop to zoom.',
  '旋转铜镜寻找缺失纹饰':'Rotate the mirror to find the missing designs',
  '请找回跑走的鸾兽':'Find the runaway luan birds and auspicious beasts',
  '找回成功':'All creatures found',
  '选择走失的鸾兽纹饰':'Choose a missing creature',
  '选择第一只鸾鸟':'Choose the first luan bird',
  '选择第二只鸾鸟':'Choose the second luan bird',
  '选择第一只瑞兽':'Choose the first auspicious beast',
  '选择第二只瑞兽':'Choose the second auspicious beast',
  '第一只鸾鸟':'First luan bird',
  '第二只鸾鸟':'Second luan bird',
  '第一只瑞兽':'First auspicious beast',
  '第二只瑞兽':'Second auspicious beast',
  '将选中的鸾兽放回此处':'Place the selected creature here',
  '旋转青花盘寻找缺失花纹':'Rotate the lotus plate to find the missing designs',
  '请找回失踪的花纹':'Find the missing designs',
  '寻找成功':'All designs found',
  '选择花纹':'Choose a design',
  '选择莲蓬纹饰':'Choose the seedpod design',
  '选择叶片纹饰':'Choose the leaf design',
  '选择花朵纹饰':'Choose the flower design',
  '莲蓬纹饰':'Lotus seedpod design',
  '叶片纹饰':'Leaf design',
  '花朵纹饰':'Flower design',
  '将选中的花纹放回此处':'Place the selected design here',
  '旋转陶罐观察七个刻划符号':'Rotate the jar to examine seven incised signs',
  '请清除多余的刻划符号':'Remove the extra incised signs',
  '清除成功':'Extra signs cleared',
  '选择擦除工具':'Choose the erasing tool',
  '选择抹布，再点击要擦除的刻符':'Choose the cloth, then select a sign to erase',
  '抹布':'Cloth',
  '选择此处刻划符号进行辨认':'Select this incised sign',
  '旋转盖罐拼接龙纹':'Rotate the covered jar to reassemble the dragon',
  '请拼接一条完整的龙':'Reassemble the dragon',
  '拼接成功':'The dragon is whole again',
  '选择龙纹碎片':'Choose a dragon fragment',
  '选择龙头':'Choose the dragon head',
  '选择龙前爪':'Choose the front claw',
  '选择龙后爪':'Choose the rear claw',
  '选择龙身':'Choose the dragon body',
  '龙头':'Dragon head',
  '龙前爪':'Front claw',
  '龙后爪':'Rear claw',
  '龙身':'Dragon body',
  '将选中的龙纹拼回此处':'Place the selected dragon fragment here',
  '银槎杯与茶壶三维互动':'Silver raft cup and teapot activity',
  '正在载入银槎杯…':'Loading the silver raft cup…',
  '银槎杯加载失败，请刷新页面重试。':'The cup could not be loaded. Reload to try again.',
  '倒水完成':'Water poured',
  '请将壶中的水正确倒入杯中':'Pour water from the teapot into the cup',
  '茶壶托盘':'Teapot tray',
  '按住并拖动茶壶':'Hold and drag the teapot',
  '茶壶':'Teapot',
};

const translations = new WeakMap();
const attributes = ['aria-label', 'alt', 'title'];

// The scan and play pages share an iframe. Observe their visible copy without
// restarting tracking, replacing the scene, or reloading a partially solved task.
export function localizeActivity(frame, isEnglish, name) {
  const doc = frame.contentDocument;
  if (!doc?.querySelector('main')) return;
  let locale = translations.get(doc);
  if (!locale) {
    const source = new WeakMap();
    const title = doc.querySelector('h1');
    const chineseName = title?.textContent.trim();
    const secondary = 'header p, .task > p, #success > span, #camera-message br';
    const style = doc.createElement('style');
    style.textContent = `body[data-story-language] :is(${secondary}) { display:none; }
      body[data-story-language="en"] :is(h1,.task h2,#success,#success span) {
        font-family:Georgia,serif !important; letter-spacing:.015em;
      }
      body[data-story-language="en"] #success[data-has-subtitle] { max-width:calc(100% - 18px); white-space:normal; }
      body[data-story-language] #success > span:only-child:first-child { display:revert; }
      body[data-story-language] #success[data-has-subtitle] > span { display:none !important; }`;
    doc.head.append(style);
    const success = doc.querySelector('#success');
    if (success?.firstChild?.nodeType === Node.TEXT_NODE && success.querySelector('span')) success.dataset.hasSubtitle = '';

    function localize(owner, field, current, set, node = owner) {
      const originals = source.get(owner) ?? {};
      const saved = originals[field];
      const original = saved?.last === current ? saved.original : current;
      const key = original.trim();
      if (!key) return;
      let next = original;
      if (node.parentElement?.id === 'camera-message' && /^Open over|^Camera unavailable\./.test(key)) {
        next = '';
      } else if (key === chineseName) {
        next = locale.isEnglish ? locale.name : chineseName;
      } else if (english[key]) {
        next = locale.isEnglish ? english[key] : key;
      } else if (/\p{Script=Han}/u.test(key) && key.includes(' / ')) {
        const [zh, en] = key.split(' / ');
        next = locale.isEnglish ? en : zh;
      }
      originals[field] = {original, last:next};
      source.set(owner, originals);
      if (next !== current) set(next);
    }
    function translate(root) {
      if (root.nodeType === Node.TEXT_NODE) {
        if (!root.parentElement?.closest('script,style')) localize(root,'text',root.data,value=>{root.data=value;});
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      for (const field of attributes) {
        const value = root.getAttribute(field);
        if (value) localize(root,field,value,next=>root.setAttribute(field,next));
      }
      for (const child of root.childNodes) translate(child);
    }
    locale = {translate};
    translations.set(doc,locale);
    new MutationObserver(records => {
      for (const change of records) {
        if (change.type === 'childList') change.addedNodes.forEach(translate);
        else translate(change.target);
      }
    }).observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
  }
  locale.isEnglish = isEnglish;
  locale.name = name;
  doc.documentElement.lang = isEnglish ? 'en' : 'zh-CN';
  doc.body.dataset.storyLanguage = isEnglish ? 'en' : 'zh-CN';
  locale.translate(doc.body);
  if (isEnglish) doc.title = name;
  else doc.title = doc.querySelector('h1').textContent;
  return doc;
}
