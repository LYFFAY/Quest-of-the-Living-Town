// Object names and collection links follow 3D模型list.xlsx.
// Descriptions are based on the historical notes in 3D文物信息.xlsx.
const collectionURL = 'https://wuzhongmuseum.com/portal/collection/content?id=';

export const collection = {
  mirror: {
    source: collectionURL + 'fc8e646564202b0006171ffc133358a2',
    en: 'Tang Bronze Mirror with Luan Birds and Auspicious Beasts',
    meta: ['唐 · 青铜 · 直径 26.8 厘米，通高 0.9 厘米', 'Tang dynasty · Bronze · Diameter 26.8 cm, overall height 0.9 cm'],
    paragraphs: [
      ['这面铜镜呈八瓣菱花形，镜面磨光，可用来照容。镜背中央铸有一只伏卧的兽，兽腹下穿孔，可系绳作镜纽。',
       'The mirror has eight lobes and a polished reflecting surface. A crouching animal at the centre of the back forms the knob, with a hole beneath its belly for threading a cord.'],
      ['镜背的圆形界线将纹饰分为内外两区。内区饰两只鸾鸟、两只瑞兽，间饰缠枝莲。外区有八组飞鸟、蝴蝶及花草。这一类镜在盛唐流行。',
       'A circular border divides the decoration into two zones. Two luan birds and two auspicious beasts alternate with scrolling lotus stems in the inner zone. Eight groups of birds, butterflies and plants decorate the outer zone. Mirrors of this kind were popular in the High Tang.'],
    ],
  },
  lotus: {
    source: collectionURL + 'fc8e646564202b0006171fff7b877e52',
    en: 'Ming Xuande Blue-and-White Plate with a Lotus Bouquet',
    meta: ['明宣德 · 瓷 · 高 5.9 厘米，口径 31.1 厘米，足径 22.4 厘米', 'Xuande reign, Ming dynasty · Porcelain · Height 5.9 cm, rim diameter 31.1 cm, foot diameter 22.4 cm'],
    paragraphs: [
      ['此盘出自明宣德时期的景德镇官窑。圆唇、敞口、浅弧壁，底部有圈足。盘心绘以带束起的莲花与莲叶，内外口沿下饰卷草纹，内外壁绘缠枝牡丹和菊花。',
       'Made at the Jingdezhen imperial kilns during the Xuande reign, this shallow plate has a rounded rim and a ring foot. A ribbon ties the lotus bouquet at its centre. Scrolls border the rim, while scrolling peonies and chrysanthemums decorate the walls.'],
      ['盘上使用进口钴料“苏渤泥青”。深浓的蓝色中可见带金属光泽的深色斑点，俗称铁锈斑，部分线条的边缘可见青花晕散。',
       'The imported cobalt pigment known as suboniqing produced a rich blue. Dark spots with a metallic sheen, commonly called iron-rust spots, appear in the blue, and some painted edges have a soft, diffused appearance.'],
    ],
  },
  pottery: {
    source: collectionURL + 'fc8e646564202b0006171fc32cae3328',
    en: 'Black-Coated Pottery Jar with Incised Symbols and Tubular Lugs',
    meta: ['新石器时代良渚文化 · 陶 · 高 12 厘米，口径 8.8 厘米', 'Liangzhu culture, Neolithic period · Pottery · Height 12 cm, rim diameter 8.8 cm'],
    paragraphs: [
      ['此罐出土于澄湖遗址。器物为直口、高领、鼓腹、平底，颈下有一周凸弦纹，两侧置对称贯耳，器表经过打磨。',
       'Excavated at the Chenghu Lake site, the jar has a straight mouth, a tall neck, a rounded belly and a flat base. A raised band runs below the neck, and two tubular lugs sit on opposite sides. Its surface is burnished.'],
      ['真品外腹横向排列四个符号，陶器烧成后以锋刃工具刻出。它们的含义尚无定论，有研究者提出这些符号可能与早期文字有关。',
       'Four signs run across the outside of the belly. They were cut with a sharp tool after the vessel was fired. Their meaning remains debated. Some researchers have suggested a connection with early writing.'],
    ],
  },
  dragon: {
    source: collectionURL + 'fc8e646564202b0006171fdf5e51e284',
    en: 'Yuan Jingdezhen Covered Jar with Underglaze-Red Clouds and Dragons',
    meta: ['元 · 瓷 · 通高 38.2 厘米，口径 12.7 厘米，腹径 25 厘米，底径 13.7 厘米', 'Yuan dynasty · Porcelain · Overall height 38.2 cm, rim diameter 12.7 cm, belly diameter 25 cm, base diameter 13.7 cm'],
    paragraphs: [
      ['此罐出土于通安华山。器身短颈、丰肩、鼓腹，盖上有宝珠形纽。腹部浅刻两条盘龙，白色龙身在釉里红色块的衬托下，呈现穿行于红云间的效果。',
       'Unearthed at Huashan in Tong’an, the jar has a short neck, broad shoulders, a rounded belly and a jewel-shaped lid knob. Two dragons incised on the belly stand out in white against the red, as though moving through clouds.'],
      ['釉里红以铜为呈色剂，装饰在透明釉下，经高温烧成。铜红呈色对窑内温度和气氛十分敏感。此罐是少见的早期釉里红瓷器。',
       'The red decoration was applied beneath a transparent glaze, with copper as the colourant. Achieving this red at high temperatures requires careful control of the kiln temperature and atmosphere. The jar is a rare early example of underglaze-red porcelain.'],
    ],
  },
  raft: {
    source: collectionURL + 'fc8e646564202b0006171fe13d7ec378',
    en: 'Yuan Silver Raft-Shaped Cup by Zhu Bishan (1345)',
    meta: ['元至正乙酉年（1345）· 银 · 斜长 22 厘米，宽 7.5 厘米，高 11.4 厘米', 'Yuan dynasty, 1345 · Silver · Diagonal length 22 cm, width 7.5 cm, height 11.4 cm'],
    paragraphs: [
      ['此杯于 1973 年出土于苏州吴县藏书公社社光大队。槎背阴刻“至正乙酉朱碧山造”，记下了制作年代与银工姓名。',
       'The cup was excavated in 1973 at Sheguang in the former Wuxian County, Suzhou. An incised inscription on the back names the silversmith Zhu Bishan and dates the piece to the yiyou year of the Zhizheng reign (1345).'],
      ['银酒杯制成枯木小舟的形状，槎尾坐着一位老人，取材自乘槎到达天河的传说。作品结合镂刻、焊接、圆雕和浮雕等工艺，将人物、树槎和云气融为一体。',
       'The silver drinking vessel takes the form of a raft made from a branch, with an elderly figure seated at the stern. It evokes the legend of travelling by raft to the celestial river. Piercing, soldering, sculpture in the round and relief bring the figure, wood and clouds into a single composition.'],
    ],
  },
};

export const distractors = {
  guqin: ['古琴', 'Guqin (Chinese Zither)'],
  celadon: ['青瓷扁壶', 'Yue-Kiln Celadon Flat Flask'],
  he: ['楚途盉', 'Chu Tu He (Bronze Pouring Vessel)'],
};
