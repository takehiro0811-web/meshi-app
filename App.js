// =====================================================================
// 今日なに食べる？ - Expo版（AdMob広告付き）
// =====================================================================
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, Platform, TextInput, Modal, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd, BannerAdSize, InterstitialAd,
  AdEventType, TestIds,
} from 'react-native-google-mobile-ads';

// ─── AdMob ID ────────────────────────────────────────────────────────
const IS_TEST = false; // テスト時は true にする
const ADMOB_APP_ID   = 'ca-app-pub-9360230936754650~5232823603';
const BANNER_ID      = IS_TEST ? TestIds.BANNER      : 'ca-app-pub-9360230936754650/1035617781';
const INTERSTITIAL_ID= IS_TEST ? TestIds.INTERSTITIAL: 'ca-app-pub-9360230936754650/9621608251';

// ─── カラーテーマ ─────────────────────────────────────────────────────
const C = {
  bg:      '#0e0b07',
  surface: '#1a1408',
  card:    '#221c0f',
  accent:  '#f5a623',
  accent2: '#e85d2f',
  accent3: '#5cb85c',
  text:    '#f2e6d0',
  muted:   '#8a7860',
  border:  '#3a2e1c',
};

// ─── データ ───────────────────────────────────────────────────────────
const GENRES = [
  { id:'japanese', label:'和食',       emoji:'🍱', kw:'和食 定食' },
  { id:'chinese',  label:'中華',       emoji:'🥟', kw:'中華料理' },
  { id:'western',  label:'洋食',       emoji:'🍝', kw:'洋食' },
  { id:'korean',   label:'韓国料理',   emoji:'🌶️', kw:'韓国料理' },
  { id:'italian',  label:'イタリアン', emoji:'🍕', kw:'イタリアン ピザ' },
  { id:'sushi',    label:'寿司',       emoji:'🍣', kw:'寿司' },
  { id:'ramen',    label:'ラーメン',   emoji:'🍜', kw:'ラーメン' },
  { id:'curry',    label:'カレー',     emoji:'🍛', kw:'カレー' },
  { id:'yakiniku', label:'焼肉',       emoji:'🥩', kw:'焼肉' },
  { id:'burger',   label:'バーガー',   emoji:'🍔', kw:'ハンバーガー' },
  { id:'asian',    label:'アジア料理', emoji:'🌏', kw:'タイ料理 ベトナム料理' },
  { id:'sweets',   label:'スイーツ',   emoji:'🍰', kw:'カフェ スイーツ' },
  { id:'other',    label:'その他',     emoji:'🍽️', kw:'レストラン' },
];

const MEALS = {
  japanese:{
    cooking:[
      {name:'親子丼',      emoji:'🍚', tips:'卵は半熟が美味しい。簡単で栄養◎'},
      {name:'みそ汁定食',  emoji:'🍲', tips:'豆腐・ワカメ・ネギで手軽に。'},
      {name:'肉じゃが',    emoji:'🥔', tips:'作り置きにも最適。甘辛い味付けが◎'},
      {name:'おにぎり',    emoji:'🍙', tips:'具は鮭・梅・ツナマヨが定番！'},
      {name:'炊き込みご飯',emoji:'🍚', tips:'具材とご飯を一緒に炊くだけ！'},
    ],
    eating:[
      {name:'天ぷら定食',emoji:'🍤', tips:'旬の野菜天ぷらが楽しめるお店へ。'},
      {name:'うな重',    emoji:'🐟', tips:'たまには贅沢に！スタミナにも。'},
      {name:'そば',      emoji:'🍜', tips:'ざるか、温かいかき揚げそばを。'},
      {name:'焼き魚定食',emoji:'🐠', tips:'栄養満点。定食屋さんで食べよう。'},
    ],
  },
  chinese:{
    cooking:[
      {name:'チャーハン',emoji:'🍚', tips:'冷ご飯で作るとパラっとしやすい！'},
      {name:'餃子',      emoji:'🥟', tips:'市販の皮でも簡単。焼き色が命。'},
      {name:'麻婆豆腐',  emoji:'🌶️', tips:'辛さは豆板醤の量で調整しよう。'},
      {name:'酢豚',      emoji:'🍖', tips:'パイナップル派？入れない派？'},
    ],
    eating:[
      {name:'本格中華コース',emoji:'🥢', tips:'北京ダックや小籠包を堪能して。'},
      {name:'担々麺',       emoji:'🍜', tips:'本格的な担々麺が食べられるお店へ。'},
      {name:'ディムサム',   emoji:'🥟', tips:'週末のブランチにも◎ 点心を楽しんで。'},
    ],
  },
  western:{
    cooking:[
      {name:'ハンバーグ',emoji:'🍖', tips:'デミグラスかトマトソースで。'},
      {name:'オムライス',emoji:'🍳', tips:'ケチャップライスを卵で包んで。'},
      {name:'グラタン',  emoji:'🧀', tips:'ホワイトソースは市販品でもOK！'},
    ],
    eating:[
      {name:'ビーフシチュー',emoji:'🥘', tips:'本格洋食店でゆっくり食べよう。'},
      {name:'ステーキ',      emoji:'🥩', tips:'焼き加減はミディアムが◎'},
      {name:'ロールキャベツ',emoji:'🥬', tips:'洋食屋さんの定番メニュー。'},
    ],
  },
  korean:{
    cooking:[
      {name:'ビビンバ',  emoji:'🍚', tips:'ナムルと卵・コチュジャンで混ぜるだけ！'},
      {name:'チゲ鍋',   emoji:'🫕', tips:'豆腐キムチチゲが手軽でおすすめ。'},
      {name:'チャプチェ',emoji:'🍜', tips:'春雨と野菜・牛肉の炒め物。甘辛い！'},
    ],
    eating:[
      {name:'サムギョプサル',emoji:'🥩', tips:'友達と食べると盛り上がる！'},
      {name:'コムタンスープ',emoji:'🍲', tips:'牛骨の白濁スープで体も温まる。'},
      {name:'石焼きビビンバ',emoji:'🍳', tips:'おこげが最高！本場の味を。'},
    ],
  },
  italian:{
    cooking:[
      {name:'ペペロンチーノ',    emoji:'🍝', tips:'シンプルだからこそ技術が光る。'},
      {name:'カルボナーラ',      emoji:'🥚', tips:'卵とチーズで。生クリームなしが本格派。'},
      {name:'トマトソースパスタ',emoji:'🍅', tips:'ホールトマト缶で手軽に本格的に。'},
    ],
    eating:[
      {name:'ナポリピザ',  emoji:'🍕', tips:'薪窯焼きのお店を探してみて！'},
      {name:'リゾット',    emoji:'🍚', tips:'クリームか、トマトか。季節の食材で。'},
      {name:'アラビアータ',emoji:'🌶️', tips:'辛旨トマトソース。イタリアンで頼もう。'},
    ],
  },
  sushi:{
    cooking:[
      {name:'手巻き寿司',emoji:'🌮', tips:'家族・友達と一緒に楽しもう！'},
      {name:'押し寿司',  emoji:'🍣', tips:'型に入れて押すだけ。サーモンが人気。'},
    ],
    eating:[
      {name:'回転寿司',         emoji:'🍣', tips:'好きなネタを好きなだけ！ランチが安い。'},
      {name:'江戸前寿司（高級）',emoji:'🎎', tips:'カウンターでおまかせを。特別な日に◎'},
      {name:'海鮮丼',           emoji:'🐟', tips:'市場や港近くのお店が新鮮で安い！'},
    ],
  },
  ramen:{
    cooking:[
      {name:'醤油ラーメン',emoji:'🍜', tips:'チャーシューと煮卵を仕込んで本格的に。'},
      {name:'味噌ラーメン',emoji:'🍜', tips:'市販スープに野菜を足してアレンジ！'},
    ],
    eating:[
      {name:'豚骨ラーメン',emoji:'🍜', tips:'濃厚スープは専門店でないと出ない味。'},
      {name:'塩ラーメン',  emoji:'🍜', tips:'あっさり派に。上品なスープを楽しんで。'},
      {name:'つけ麺',      emoji:'🍜', tips:'濃厚つけ汁に極太麺。満足感が違う！'},
    ],
  },
  curry:{
    cooking:[
      {name:'ビーフカレー',emoji:'🍛', tips:'翌日のカレーが一番美味しい！'},
      {name:'キーマカレー',emoji:'🥘', tips:'ひき肉カレーはナンにも合う。'},
      {name:'スープカレー',emoji:'🍲', tips:'野菜ごろごろ。スパイスを多めに！'},
    ],
    eating:[
      {name:'本格インドカレー',emoji:'🫓', tips:'ナンと一緒に食べると格別！'},
      {name:'タイカレー',      emoji:'🥥', tips:'グリーンかレッドか。ジャスミンライスで。'},
      {name:'スパイスカレー',  emoji:'🌶️', tips:'独創的な一皿系カレー専門店へ！'},
    ],
  },
  yakiniku:{
    cooking:[
      {name:'焼き肉（家焼き）',emoji:'🥩', tips:'煙に注意！窓を開けて換気しっかりと。'},
      {name:'ホルモン炒め',    emoji:'🍳', tips:'ニラとモツを甘辛く炒めて。ご飯進む！'},
    ],
    eating:[
      {name:'焼肉食べ放題',emoji:'🍖', tips:'肉はまず塩から食べると甘みがわかる。'},
      {name:'高級焼肉',    emoji:'🥩', tips:'黒毛和牛をタレなしで。脂の甘みを。'},
      {name:'ホルモン焼き',emoji:'🔥', tips:'部位ごとの食感が楽しい！'},
    ],
  },
  burger:{
    cooking:[
      {name:'手作りバーガー',emoji:'🍔', tips:'パティを厚めに。スモークチーズが◎'},
      {name:'ホットサンド',  emoji:'🥪', tips:'ホットサンドメーカーがあれば最高！'},
    ],
    eating:[
      {name:'グルメバーガー',emoji:'🍔', tips:'専門店の分厚いパティを食べよう！'},
      {name:'ファストフード',emoji:'🍟', tips:'サクっと食べたい時に。セットで頼もう。'},
    ],
  },
  asian:{
    cooking:[
      {name:'パッタイ',         emoji:'🍜', tips:'ナンプラーとタマリンドが味の決め手！'},
      {name:'グリーンカレー',    emoji:'🟢', tips:'ココナッツミルクたっぷりで本格的に。'},
      {name:'フォー',           emoji:'🍲', tips:'牛骨スープは市販品でも十分美味しい。'},
      {name:'バインミー',        emoji:'🥖', tips:'パゲットにパクチー・なます・肉を挟んで。'},
      {name:'トムヤムスープ',    emoji:'🍵', tips:'レモングラスと唐辛子で酸辛に仕上げて。'},
      {name:'ナシゴレン',        emoji:'🍳', tips:'インドネシア風チャーハン。目玉焼きをのせて！'},
      {name:'ルーローハン',      emoji:'🍚', tips:'豚バラ煮込みをご飯にかける台湾定番飯。'},
      {name:'サムゲタン',        emoji:'🍗', tips:'鶏肉をもち米・高麗人参で煮込んだ韓国薬膳スープ。'},
    ],
    eating:[
      {name:'タイ料理',         emoji:'🇹🇭', tips:'パッタイ・グリーンカレー・ガパオが定番！'},
      {name:'ベトナム料理',      emoji:'🇻🇳', tips:'フォー・バインミー・生春巻きを楽しんで。'},
      {name:'インド料理',        emoji:'🇮🇳', tips:'ナン・ラッシーと本格カレーのセットを。'},
      {name:'タイスキ',          emoji:'🫕', tips:'タイ風しゃぶしゃぶ。甘辛のナムチムソースで。'},
      {name:'ネパール料理',      emoji:'🏔️', tips:'ダルバートはネパールの定食。スパイスが絶妙。'},
      {name:'台湾料理',          emoji:'🇹🇼', tips:'小籠包・魯肉飯・台湾ラーメンが人気。'},
      {name:'シンガポール料理',  emoji:'🦀', tips:'チリクラブやチキンライスを本場の味で。'},
    ],
  },
  sweets:{
    cooking:[
      {name:'パンケーキ',emoji:'🥞', tips:'生地を休ませると厚みが出る！'},
      {name:'プリン',    emoji:'🍮', tips:'カラメルがポイント。卵・牛乳・砂糖だけ。'},
      {name:'クレープ',  emoji:'🫔', tips:'薄く焼いていろんな具を巻いて楽しもう。'},
    ],
    eating:[
      {name:'パフェ',     emoji:'🍨', tips:'季節限定フルーツパフェを狙って！'},
      {name:'ケーキセット',emoji:'🎂', tips:'カフェでお気に入りのケーキを。コーヒーと◎'},
      {name:'かき氷',     emoji:'🧊', tips:'夏は絶対！シロップは天然系が美味しい。'},
    ],
  },
};

// ─── ユーティリティ ───────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const da = r(lat2-lat1), db = r(lng2-lng1);
  const a = Math.sin(da/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(db/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`; }

// ジャンル別の日本語検索キーワード（Google Maps で精度高く絞れる語）
const GENRE_SEARCH = {
  japanese: '和食 定食 居酒屋',
  chinese:  '中華料理 中国料理',
  western:  '洋食 レストラン',
  korean:   '韓国料理',
  italian:  'イタリアン ピザ パスタ',
  sushi:    '寿司 鮨 寿し',
  ramen:    'ラーメン',
  curry:    'カレー インドカレー',
  yakiniku: '焼肉 ホルモン',
  burger:   'ハンバーガー バーガー',
  asian:    'タイ料理 ベトナム料理 アジア料理',
  sweets:   'カフェ スイーツ ケーキ',
  other:    'レストラン',
};

// Google Maps "near me" 検索URL を生成
function buildGoogleMapsUrl(genreId, mealName, lat, lng) {
  const kw = GENRE_SEARCH[genreId] || mealName;
  const query = encodeURIComponent(kw);
  // Maps の near 検索（現在地周辺）
  return `https://www.google.com/maps/search/${query}/@${lat},${lng},15z`;
}

// Google Maps ナビURL
function buildNavUrl(lat, lng, destLat, destLng) {
  return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${destLat},${destLng}&travelmode=walking`;
}

// ─── レシピデータ（静的・Snack対応） ────────────────────────────────
const RECIPES = {
  '親子丼':{ servings:'2人分', time:'15分',
    ingredients:[{name:'鶏もも肉',amount:'200g'},{name:'卵',amount:'3個'},{name:'玉ねぎ',amount:'1/2個'},{name:'だし汁',amount:'150ml'},{name:'醤油',amount:'大さじ2'},{name:'みりん',amount:'大さじ2'},{name:'砂糖',amount:'小さじ1'},{name:'ご飯',amount:'2膳分'}],
    steps:['玉ねぎを薄切りにする。鶏もも肉は一口大に切る。','小鍋にだし汁・醤油・みりん・砂糖を入れて中火にかける。','玉ねぎ→鶏肉の順に加え、鶏肉に火が通るまで5分煮る。','溶き卵を回しかけ、半熟になったら火を止める。','ご飯の上に盛り付けて完成。'],
    point:'卵は2回に分けて入れると外はふわ、中はとろとろに仕上がる。'},
  'みそ汁定食':{ servings:'2人分', time:'20分',
    ingredients:[{name:'豆腐',amount:'1/2丁'},{name:'わかめ（乾燥）',amount:'大さじ1'},{name:'ネギ',amount:'1/4本'},{name:'だし汁',amount:'400ml'},{name:'味噌',amount:'大さじ2〜3'},{name:'ご飯',amount:'2膳分'},{name:'好みの副菜',amount:'適宜'}],
    steps:['豆腐を1cm角に切る。わかめは水で戻しておく。','鍋にだし汁を入れて中火で温める。','豆腐・わかめを加えて煮立ったら弱火にする。','味噌を溶き入れ、沸騰直前で火を止める。','ネギを散らし、ご飯と一緒に盛り付ける。'],
    point:'味噌を入れたら煮立てないのが香りを残すコツ。'},
  '肉じゃが':{ servings:'4人分', time:'35分',
    ingredients:[{name:'牛薄切り肉',amount:'200g'},{name:'じゃがいも',amount:'3個'},{name:'玉ねぎ',amount:'1個'},{name:'にんじん',amount:'1本'},{name:'だし汁',amount:'300ml'},{name:'醤油',amount:'大さじ3'},{name:'みりん',amount:'大さじ3'},{name:'砂糖',amount:'大さじ2'},{name:'サラダ油',amount:'大さじ1'}],
    steps:['じゃがいもは大きめに切り水にさらす。玉ねぎはくし切り、にんじんは乱切り。','鍋で油を熱し、牛肉を炒める。色が変わったら野菜を加えてさらに炒める。','だし汁・醤油・みりん・砂糖を加え、落としぶたをして中火で20分煮る。','じゃがいもが柔らかくなったら完成。'],
    point:'落としぶたをすることで煮汁が全体に回り、均一に味が染みる。'},
  'おにぎり':{ servings:'2人分', time:'10分',
    ingredients:[{name:'ご飯',amount:'2膳分（温かいもの）'},{name:'塩',amount:'少々'},{name:'鮭フレーク',amount:'大さじ2'},{name:'梅干し',amount:'2個'},{name:'焼き海苔',amount:'適量'}],
    steps:['ご飯を2膳分用意し、少し冷ます。','手に塩を少しつけ、ご飯を手のひらに広げる。','具材（鮭フレークまたは梅干し）を中心に置く。','ご飯で具を包み込み、三角形に形を整える。','海苔を巻いて完成。'],
    point:'ご飯が熱すぎると手が痛い。少し冷ましてから握ると形がまとまりやすい。'},
  '炊き込みご飯':{ servings:'3〜4人分', time:'50分（炊飯含む）',
    ingredients:[{name:'米',amount:'2合'},{name:'鶏もも肉',amount:'150g'},{name:'にんじん',amount:'1/2本'},{name:'ごぼう',amount:'1/3本'},{name:'油揚げ',amount:'1枚'},{name:'醤油',amount:'大さじ2'},{name:'みりん',amount:'大さじ1'},{name:'酒',amount:'大さじ1'},{name:'だし汁',amount:'適量'}],
    steps:['米を洗い、ザルにあげておく。','鶏肉・にんじん・ごぼう・油揚げを細かく切る。','炊飯釜に米を入れ、醤油・みりん・酒を加える。','2合の目盛りまでだし汁を注ぎ、具材を上に並べる。','通常通り炊いて、炊き上がったら全体を混ぜる。'],
    point:'具材は米の上に置くだけ。混ぜて炊くと焦げる原因になる。'},
  'チャーハン':{ servings:'2人分', time:'10分',
    ingredients:[{name:'冷やご飯',amount:'2膳分'},{name:'卵',amount:'2個'},{name:'ネギ',amount:'1/4本'},{name:'焼豚orハム',amount:'50g'},{name:'醤油',amount:'大さじ1'},{name:'塩・こしょう',amount:'適量'},{name:'ごま油',amount:'大さじ1'},{name:'サラダ油',amount:'大さじ2'}],
    steps:['ネギと焼豚は小さく切る。卵は溶いておく。','フライパンを強火で熱し、油をひいて溶き卵を入れる。','卵が半熟のうちにご飯を加えてほぐしながら炒める。','焼豚・ネギを加えてさらに炒める。','醤油・塩こしょうで味を整え、仕上げにごま油を回しかける。'],
    point:'強火・短時間が鉄則。冷やご飯を使うとパラパラに仕上がる。'},
  '餃子':{ servings:'2人分（約20個）', time:'40分',
    ingredients:[{name:'餃子の皮',amount:'20枚'},{name:'豚ひき肉',amount:'150g'},{name:'キャベツ',amount:'150g'},{name:'ニラ',amount:'1/3束'},{name:'生姜',amount:'1かけ'},{name:'醤油',amount:'大さじ1'},{name:'ごま油',amount:'大さじ1'},{name:'塩・こしょう',amount:'少々'}],
    steps:['キャベツはみじん切りにして塩もみし、水気を絞る。ニラも細かく切る。','ひき肉に醤油・ごま油・塩こしょう・みじん切りの生姜を加えてよく練る。','キャベツとニラを加えて混ぜる。','餃子の皮に具をのせ、縁に水をつけてひだを作りながら閉じる。','フライパンに油をひき、餃子を並べて中火で焼く。焼き色がついたら水を入れてふたをし蒸し焼きにする。水分が飛んだら完成。'],
    point:'水を入れてすぐにふたをすること。蒸し焼きにするとパリッともちもちの食感になる。'},
  '麻婆豆腐':{ servings:'2〜3人分', time:'20分',
    ingredients:[{name:'絹ごし豆腐',amount:'1丁'},{name:'豚ひき肉',amount:'100g'},{name:'豆板醤',amount:'小さじ1〜2'},{name:'にんにく',amount:'1かけ'},{name:'生姜',amount:'1かけ'},{name:'ネギ',amount:'1/4本'},{name:'鶏がらスープ',amount:'150ml'},{name:'醤油',amount:'大さじ1'},{name:'みりん',amount:'大さじ1'},{name:'水溶き片栗粉',amount:'大さじ2'},{name:'ごま油',amount:'少々'}],
    steps:['豆腐は2cm角に切る。にんにく・生姜・ネギはみじん切り。','フライパンにごま油を熱し、にんにく・生姜・豆板醤を炒め香りを出す。','ひき肉を加えてほぐしながら炒める。','鶏がらスープ・醤油・みりんを加えて煮立てる。','豆腐を加えて2〜3分煮たら水溶き片栗粉でとろみをつける。ネギを散らして完成。'],
    point:'豆板醤の量で辛さが決まる。最初は少なめにして調整しよう。'},
  '酢豚':{ servings:'2人分', time:'30分',
    ingredients:[{name:'豚ロース（角切り）',amount:'200g'},{name:'ピーマン',amount:'2個'},{name:'玉ねぎ',amount:'1/2個'},{name:'にんじん',amount:'1/2本'},{name:'片栗粉',amount:'大さじ3'},{name:'酢',amount:'大さじ3'},{name:'砂糖',amount:'大さじ2'},{name:'醤油',amount:'大さじ2'},{name:'ケチャップ',amount:'大さじ2'},{name:'鶏がらスープ',amount:'大さじ3'}],
    steps:['豚肉に塩こしょうをして片栗粉をまぶし、170℃の油で揚げる。','野菜は食べやすい大きさに切り、さっと炒める。','酢・砂糖・醤油・ケチャップ・スープを混ぜ合わせてフライパンで煮立てる。','揚げた豚肉と野菜を加えてからめる。'],
    point:'揚げた肉はすぐにソースにからめると衣がべちゃっとしない。'},
  'ハンバーグ':{ servings:'2人分', time:'30分',
    ingredients:[{name:'合いびき肉',amount:'300g'},{name:'玉ねぎ',amount:'1/2個'},{name:'卵',amount:'1個'},{name:'パン粉',amount:'大さじ3'},{name:'牛乳',amount:'大さじ2'},{name:'塩',amount:'小さじ1/2'},{name:'こしょう',amount:'少々'},{name:'ナツメグ',amount:'少々'},{name:'ケチャップ・ウスターソース',amount:'各大さじ2'}],
    steps:['玉ねぎをみじん切りにして炒め、冷ます。','ひき肉・炒め玉ねぎ・卵・パン粉・牛乳・調味料を混ぜ、粘りが出るまでこねる。','小判型に成形し、中央をくぼませる。','フライパンで両面に焼き色をつけ、水を加えてふたをして中火で10分蒸し焼き。','ケチャップとウスターソースを混ぜたソースをかけて完成。'],
    point:'中央をくぼませて焼くと均一に火が通り、ふっくら仕上がる。'},
  'オムライス':{ servings:'2人分', time:'20分',
    ingredients:[{name:'ご飯',amount:'2膳分'},{name:'鶏もも肉',amount:'100g'},{name:'玉ねぎ',amount:'1/4個'},{name:'卵',amount:'4個'},{name:'ケチャップ',amount:'大さじ4'},{name:'塩・こしょう',amount:'少々'},{name:'バター',amount:'20g'}],
    steps:['鶏肉と玉ねぎを小さく切り、バターで炒める。','ご飯を加えてケチャップ・塩こしょうで味付けし、チキンライスを作る。','卵2個を溶いて塩少々を加え、バターをひいたフライパンで薄焼き卵を作る。','チキンライスを卵で包み、皿に盛り付けてケチャップをかけて完成。'],
    point:'卵は半熟の状態でライスをのせてすぐに包む。手早さがふわふわの秘訣。'},
  'グラタン':{ servings:'2人分', time:'40分',
    ingredients:[{name:'鶏もも肉',amount:'150g'},{name:'マカロニ',amount:'80g'},{name:'玉ねぎ',amount:'1/2個'},{name:'ホワイトソース（缶）',amount:'1缶'},{name:'牛乳',amount:'100ml'},{name:'シュレッドチーズ',amount:'50g'},{name:'塩・こしょう',amount:'少々'},{name:'バター',amount:'10g'}],
    steps:['マカロニを茹でておく。鶏肉と玉ねぎを切って炒める。','ホワイトソースと牛乳を混ぜて温め、鶏肉・玉ねぎ・マカロニを加える。','塩こしょうで味を整え、グラタン皿に入れる。','チーズをのせて200℃のオーブンで15〜20分焼く。'],
    point:'チーズはたっぷりのせるほど焼き色がきれいになる。'},
  'ビビンバ':{ servings:'2人分', time:'25分',
    ingredients:[{name:'ご飯',amount:'2膳分'},{name:'牛ひき肉',amount:'100g'},{name:'ほうれん草',amount:'1束'},{name:'もやし',amount:'100g'},{name:'にんじん',amount:'1/2本'},{name:'コチュジャン',amount:'大さじ2'},{name:'ごま油',amount:'大さじ1'},{name:'醤油',amount:'大さじ1'},{name:'砂糖',amount:'小さじ1'},{name:'卵',amount:'2個'}],
    steps:['ほうれん草・もやし・にんじんを茹でて水気を絞り、それぞれごま油と塩で和える（ナムル）。','牛肉をコチュジャン・醤油・砂糖・ごま油で炒める。','丼にご飯を盛り、ナムルと肉を彩りよく並べる。','中央に目玉焼きをのせ、コチュジャンを添えて完成。食べる前によく混ぜる。'],
    point:'具材を色別に並べると見た目がきれい。混ぜる前に写真を撮ろう！'},
  'チゲ鍋':{ servings:'2人分', time:'20分',
    ingredients:[{name:'豆腐',amount:'1丁'},{name:'キムチ',amount:'150g'},{name:'豚バラ肉',amount:'100g'},{name:'えのき',amount:'1/2袋'},{name:'長ネギ',amount:'1/2本'},{name:'コチュジャン',amount:'大さじ1'},{name:'鶏がらスープ',amount:'400ml'},{name:'ごま油',amount:'大さじ1'},{name:'醤油',amount:'大さじ1'}],
    steps:['鍋にごま油を熱し、豚肉とキムチを炒める。','鶏がらスープ・コチュジャン・醤油を加えて煮立てる。','豆腐・えのき・長ネギを加えて5〜7分煮たら完成。'],
    point:'キムチをよく炒めることで旨みと辛みが引き出される。'},
  'チャプチェ':{ servings:'2人分', time:'25分',
    ingredients:[{name:'春雨',amount:'60g'},{name:'牛薄切り肉',amount:'100g'},{name:'ほうれん草',amount:'1/2束'},{name:'にんじん',amount:'1/2本'},{name:'玉ねぎ',amount:'1/2個'},{name:'醤油',amount:'大さじ2'},{name:'砂糖',amount:'大さじ1'},{name:'ごま油',amount:'大さじ1'},{name:'にんにく',amount:'1かけ'}],
    steps:['春雨を水で戻してザク切りにする。野菜は細切りにする。','牛肉を醤油・砂糖・にんにくで下味をつけておく。','フライパンにごま油を熱し、野菜・牛肉の順に炒める。','春雨を加えて醤油・砂糖で味を整え、全体を炒め合わせる。','ごま油を回しかけて完成。'],
    point:'春雨は炒めすぎると切れるので最後に加えてさっと炒めるだけでOK。'},
  'ペペロンチーノ':{ servings:'2人分', time:'15分',
    ingredients:[{name:'スパゲッティ',amount:'160g'},{name:'にんにく',amount:'3かけ'},{name:'唐辛子',amount:'2本'},{name:'オリーブオイル',amount:'大さじ4'},{name:'塩',amount:'適量'},{name:'パスタの茹で汁',amount:'お玉2杯'}],
    steps:['湯を沸かし塩を加え、スパゲッティを茹でる。','フライパンにオリーブオイル・薄切りにしたにんにく・唐辛子を入れ弱火で香りを出す。','にんにくが薄く色づいたら茹で汁を加えて乳化させる。','茹で上がったパスタを加えてよくからめ、塩で味を整える。'],
    point:'乳化が命。茹で汁とオイルをしっかり混ぜてソースを作ることでパスタによくからむ。'},
  'カルボナーラ':{ servings:'2人分', time:'20分',
    ingredients:[{name:'スパゲッティ',amount:'160g'},{name:'ベーコン',amount:'80g'},{name:'卵',amount:'2個'},{name:'卵黄',amount:'2個'},{name:'パルメザンチーズ',amount:'40g'},{name:'黒こしょう',amount:'たっぷり'},{name:'塩',amount:'適量'}],
    steps:['卵・卵黄・チーズ・黒こしょうをボウルで混ぜておく。','ベーコンを炒めておく。スパゲッティを茹でる。','茹で汁少量をボウルに加えて温度を上げておく。','火を止めたフライパンにパスタ・ベーコン・卵液を加えて素早く混ぜる。'],
    point:'火を止めてから卵液を加えること。余熱だけで仕上げるととろとろになる。'},
  'トマトソースパスタ':{ servings:'2人分', time:'25分',
    ingredients:[{name:'スパゲッティ',amount:'160g'},{name:'ホールトマト缶',amount:'1缶'},{name:'玉ねぎ',amount:'1/2個'},{name:'にんにく',amount:'2かけ'},{name:'オリーブオイル',amount:'大さじ2'},{name:'砂糖',amount:'小さじ1'},{name:'塩・こしょう',amount:'適量'},{name:'バジル',amount:'お好みで'}],
    steps:['玉ねぎ・にんにくをみじん切りにしてオリーブオイルで炒める。','ホールトマト缶を加え、木べらで潰しながら10分煮詰める。','砂糖・塩こしょうで味を整える。','茹でたパスタにソースをからめて完成。'],
    point:'砂糖を少し加えるとトマトの酸味がまろやかになる。'},
  '手巻き寿司':{ servings:'4人分', time:'30分',
    ingredients:[{name:'ご飯',amount:'4膳分'},{name:'すし酢',amount:'大さじ4'},{name:'焼き海苔',amount:'8枚'},{name:'刺身（鮭・まぐろ等）',amount:'200g'},{name:'きゅうり',amount:'1本'},{name:'アボカド',amount:'1個'},{name:'卵焼き',amount:'適量'},{name:'わさび・醤油',amount:'適量'}],
    steps:['炊きたてのご飯にすし酢を加えて切るように混ぜ、うちわであおいで冷ます。','刺身・野菜・卵焼きを食べやすい大きさに切る。','海苔の上にシャリをのせ、具材を手前に置いてくるりと巻く。'],
    point:'シャリは薄めに広げると巻きやすく、海苔がしっとりするまで少し待つと食べやすい。'},
  '押し寿司':{ servings:'2人分', time:'30分',
    ingredients:[{name:'ご飯',amount:'2膳分'},{name:'すし酢',amount:'大さじ2'},{name:'スモークサーモン',amount:'100g'},{name:'きゅうり',amount:'1/2本'},{name:'ラップ',amount:'適量'}],
    steps:['ご飯にすし酢を混ぜてシャリを作る。','ラップを広げてサーモンを並べ、上にシャリを均等に広げる。','ラップで包んで型を整え、冷蔵庫で30分以上冷やす。','食べやすい大きさに切って完成。'],
    point:'型がなくてもラップで代用できる。しっかり冷やすと切りやすい。'},
  '醤油ラーメン':{ servings:'2人分', time:'30分',
    ingredients:[{name:'中華麺',amount:'2玉'},{name:'鶏がらスープ',amount:'600ml'},{name:'醤油',amount:'大さじ3'},{name:'みりん',amount:'大さじ1'},{name:'ごま油',amount:'小さじ1'},{name:'チャーシュー',amount:'4枚'},{name:'メンマ',amount:'適量'},{name:'ネギ',amount:'適量'},{name:'煮卵',amount:'2個'}],
    steps:['鍋に鶏がらスープを温め、醤油・みりんで味を整える。','中華麺を別鍋で茹でて水気を切る。','丼にスープを注ぎ、麺を入れる。','チャーシュー・メンマ・ネギ・煮卵をのせ、ごま油を垂らして完成。'],
    point:'スープは沸騰させすぎないこと。煮卵は前日に仕込むと味が染みて絶品。'},
  '味噌ラーメン':{ servings:'2人分', time:'20分',
    ingredients:[{name:'中華麺',amount:'2玉'},{name:'市販のラーメンスープ（味噌）',amount:'2袋'},{name:'もやし',amount:'100g'},{name:'コーン',amount:'大さじ4'},{name:'バター',amount:'10g'},{name:'ネギ',amount:'適量'},{name:'チャーシュー',amount:'4枚'}],
    steps:['市販のスープを表示通りに作る。','麺を茹でている間に、もやしをさっと炒める。','丼にスープを注ぎ、麺を入れる。','もやし・コーン・チャーシュー・ネギをのせ、バターをひとかけ乗せて完成。'],
    point:'バターをのせると香りとコクがぐっとアップする。'},
  'ビーフカレー':{ servings:'4人分', time:'60分',
    ingredients:[{name:'牛肉（シチュー用）',amount:'300g'},{name:'玉ねぎ',amount:'2個'},{name:'じゃがいも',amount:'3個'},{name:'にんじん',amount:'2本'},{name:'カレールー',amount:'1/2箱'},{name:'水',amount:'800ml'},{name:'サラダ油',amount:'大さじ2'}],
    steps:['玉ねぎを薄切りにして飴色になるまで炒める（約15分）。','牛肉・じゃがいも・にんじんを加えてさらに炒める。','水を加えて沸騰したらアクを取り除き、弱火で30分煮込む。','火を止めてカレールーを溶かし入れ、弱火でさらに10分煮込む。'],
    point:'玉ねぎをしっかり炒めることが甘みとコクの決め手。翌日はさらに美味しい。'},
  'キーマカレー':{ servings:'3〜4人分', time:'30分',
    ingredients:[{name:'合いびき肉',amount:'300g'},{name:'玉ねぎ',amount:'1個'},{name:'トマト缶',amount:'1/2缶'},{name:'にんにく',amount:'2かけ'},{name:'生姜',amount:'1かけ'},{name:'カレー粉',amount:'大さじ2'},{name:'ウスターソース',amount:'大さじ1'},{name:'塩',amount:'適量'},{name:'サラダ油',amount:'大さじ1'}],
    steps:['玉ねぎ・にんにく・生姜をみじん切りにして炒める。','ひき肉を加えてほぐしながら炒める。','カレー粉を加えて香りが立ったら、トマト缶を加える。','水分が飛ぶまで煮詰め、ウスターソースと塩で味を整える。'],
    point:'水分をしっかり飛ばすことでスパイスの風味が際立つ。'},
  'スープカレー':{ servings:'2人分', time:'40分',
    ingredients:[{name:'鶏もも肉',amount:'2枚'},{name:'じゃがいも',amount:'2個'},{name:'にんじん',amount:'1本'},{name:'ピーマン',amount:'2個'},{name:'ゆで卵',amount:'2個'},{name:'カレー粉',amount:'大さじ2'},{name:'鶏がらスープ',amount:'600ml'},{name:'ナンプラー',amount:'大さじ1'},{name:'塩',amount:'適量'}],
    steps:['鶏肉・野菜をオーブンまたはフライパンでこんがり焼く。','鍋に鶏がらスープ・カレー粉を入れて煮立てる。','焼いた具材を加えてスープに沈め、20分煮込む。','ナンプラー・塩で味を整えて完成。'],
    point:'具材を先に焼いてから煮込むと旨みが増す。ご飯をスープに浸しながら食べるのが流儀。'},
  '焼き肉（家焼き）':{ servings:'2人分', time:'20分',
    ingredients:[{name:'牛カルビ',amount:'200g'},{name:'牛ロース',amount:'100g'},{name:'焼肉のたれ',amount:'適量'},{name:'サンチュ',amount:'適量'},{name:'にんにく',amount:'1かけ'},{name:'塩・こしょう',amount:'適量'}],
    steps:['肉は冷蔵庫から出して常温に戻しておく。','ホットプレートまたはフライパンを強火で熱する。','肉を並べて両面をしっかり焼く（焼きすぎ注意）。','焼肉のたれや塩・こしょうでいただく。'],
    point:'肉は触らず、焼き色がついてから裏返す。窓を開けて換気しながら楽しもう。'},
  'ホルモン炒め':{ servings:'2人分', time:'15分',
    ingredients:[{name:'豚ホルモン（下処理済み）',amount:'200g'},{name:'ニラ',amount:'1束'},{name:'もやし',amount:'100g'},{name:'にんにく',amount:'2かけ'},{name:'醤油',amount:'大さじ2'},{name:'みりん',amount:'大さじ1'},{name:'ごま油',amount:'大さじ1'},{name:'コチュジャン',amount:'小さじ1（お好みで）'}],
    steps:['ホルモンは水気を拭き取る。ニラは3cm幅に切る。','フライパンにごま油を熱し、にんにくを炒めて香りを出す。','ホルモンを加えて炒め、火が通ったらもやし・ニラを加える。','醤油・みりんで味付けして完成。'],
    point:'ホルモンから脂が出るので油は少なめで。強火でさっと炒めるのがコツ。'},
  '手作りバーガー':{ servings:'2人分', time:'30分',
    ingredients:[{name:'バンズ',amount:'2個'},{name:'合いびき肉',amount:'250g'},{name:'塩・こしょう',amount:'少々'},{name:'スライスチーズ',amount:'2枚'},{name:'レタス',amount:'2枚'},{name:'トマト',amount:'1個'},{name:'玉ねぎ（薄切り）',amount:'適量'},{name:'ケチャップ・マスタード',amount:'適量'}],
    steps:['ひき肉に塩こしょうを加えてよく練り、2等分にして小判形に成形する。','フライパンで両面焼き、チーズをのせてふたをして溶かす。','バンズを軽くトーストする。','バンズにケチャップ・マスタードを塗り、野菜・パティを挟んで完成。'],
    point:'パティは真ん中をくぼませると均一に焼ける。焼いた後は少し休ませると肉汁がとじ込められる。'},
  'ホットサンド':{ servings:'1人分', time:'10分',
    ingredients:[{name:'食パン（8枚切り）',amount:'2枚'},{name:'スライスハム',amount:'2枚'},{name:'スライスチーズ',amount:'2枚'},{name:'バター',amount:'適量'}],
    steps:['食パンの片面にバターを塗る。','ハムとチーズをのせてもう一枚で挟む。','ホットサンドメーカーに入れて両面をこんがり焼く（約3分）。','熱いうちにいただく。'],
    point:'具材を変えれば無限アレンジ。卵・アボカド・ツナマヨも美味しい。'},
  'サラダボウル':{ servings:'1〜2人分', time:'10分',
    ingredients:[{name:'リーフレタスミックス',amount:'1袋'},{name:'ミニトマト',amount:'6個'},{name:'アボカド',amount:'1個'},{name:'ゆで卵',amount:'1個'},{name:'鶏むね肉（茹でて裂いたもの）',amount:'80g'},{name:'オリーブオイル',amount:'大さじ2'},{name:'レモン汁',amount:'大さじ1'},{name:'塩・こしょう',amount:'適量'}],
    steps:['野菜を洗って水気を切り、食べやすい大きさにちぎる。','アボカドは種を除いて薄切り、ゆで卵は半分に切る。','ボウルに野菜・具材を盛り付ける。','オリーブオイル・レモン汁・塩こしょうを混ぜたドレッシングをかけて完成。'],
    point:'ドレッシングは食べる直前にかけると野菜がシャキシャキのまま。'},
  '蒸し野菜':{ servings:'2人分', time:'15分',
    ingredients:[{name:'ブロッコリー',amount:'1/2個'},{name:'にんじん',amount:'1本'},{name:'かぼちゃ',amount:'1/8個'},{name:'じゃがいも',amount:'2個'},{name:'塩',amount:'少々'},{name:'オリーブオイル or バーニャカウダソース',amount:'適量'}],
    steps:['野菜を食べやすい大きさに切る。','蒸し器（またはフライパンに水を張りざるをのせる）に野菜を並べる。','ふたをして中火で10〜12分蒸す。','好みのソース・オイルを添えて完成。'],
    point:'野菜の大きさを揃えると均一に火が通る。レンジ蒸し（ラップ+600W3分）でもOK。'},
  'スムージー＋フルーツ':{ servings:'1人分', time:'5分',
    ingredients:[{name:'バナナ',amount:'1本'},{name:'ほうれん草',amount:'1握り'},{name:'豆乳',amount:'200ml'},{name:'ヨーグルト',amount:'50g'},{name:'はちみつ',amount:'大さじ1'},{name:'好みのフルーツ',amount:'適量'}],
    steps:['バナナとほうれん草を適当な大きさに切る。','ブレンダーに全ての材料を入れてなめらかになるまで撹拌する。','グラスに注いで完成。'],
    point:'ほうれん草の色で緑になるが、バナナの甘みで飲みやすい。冷凍バナナを使うとひんやり美味しい。'},
  'パッタイ':{ servings:'2人分', time:'20分',
    ingredients:[{name:'米粉麺（フォー用）',amount:'160g'},{name:'むきエビ',amount:'100g'},{name:'卵',amount:'2個'},{name:'もやし',amount:'100g'},{name:'ニラ',amount:'1/3束'},{name:'ナンプラー',amount:'大さじ2'},{name:'砂糖',amount:'大さじ1'},{name:'タマリンドペースト（またはレモン汁）',amount:'大さじ1'},{name:'サラダ油',amount:'大さじ2'},{name:'ピーナッツ砕き',amount:'大さじ2'}],
    steps:['米粉麺を水に30分浸してやわらかくしておく。','フライパンに油を熱し、エビを炒めて取り出す。','同じフライパンに麺を入れてナンプラー・砂糖・タマリンドで炒める。','麺を端に寄せて卵を割り入れ、スクランブル状にしてから全体を混ぜる。','もやし・ニラ・エビを加えてさっと炒め合わせる。','皿に盛ってピーナッツ砕きを散らし、レモンを添えて完成。'],
    point:'タマリンドがなければレモン汁で代用OK。甘酸っぱさがパッタイの命。'},
  'グリーンカレー':{ servings:'3〜4人分', time:'25分',
    ingredients:[{name:'鶏もも肉',amount:'250g'},{name:'グリーンカレーペースト',amount:'大さじ2'},{name:'ココナッツミルク',amount:'400ml'},{name:'なす',amount:'2本'},{name:'ピーマン',amount:'2個'},{name:'ナンプラー',amount:'大さじ1.5'},{name:'砂糖',amount:'小さじ1'},{name:'バジル（生）',amount:'ひとつかみ'},{name:'サラダ油',amount:'大さじ1'}],
    steps:['鶏肉を一口大に切る。なす・ピーマンも食べやすい大きさに切る。','鍋に油を熱し、カレーペーストを炒めて香りを出す。','ココナッツミルクを半量加えて混ぜ、鶏肉を加えて炒める。','残りのココナッツミルクを加えてなす・ピーマンを入れ、5〜7分煮込む。','ナンプラー・砂糖で味を整え、バジルをちぎって加えて完成。'],
    point:'カレーペーストは炒めてから液体を加えると香りが格段にアップする。'},
  'フォー':{ servings:'2人分', time:'15分（市販スープ使用）',
    ingredients:[{name:'フォー（米粉麺）',amount:'160g'},{name:'牛薄切り肉',amount:'100g'},{name:'フォースープ（市販）',amount:'2袋'},{name:'水',amount:'800ml'},{name:'もやし',amount:'50g'},{name:'ネギ',amount:'1/4本'},{name:'パクチー',amount:'適量'},{name:'ライム',amount:'1/2個'},{name:'チリソース',amount:'お好みで'}],
    steps:['鍋に水とスープの素を入れて沸かす。','フォーを別鍋で茹でて水気を切る。','丼にフォーを盛り、熱いスープを注ぐ。','生の牛肉をスープの熱で半熟状にする（火を通したければ先に茹でる）。','もやし・ネギ・パクチーをのせ、ライムを絞って完成。'],
    point:'パクチーが苦手な場合はネギだけでもOK。ライムを絞ると一気に本場の味になる。'},
  'バインミー':{ servings:'2人分', time:'20分',
    ingredients:[{name:'バゲット',amount:'1本'},{name:'豚ひき肉',amount:'150g'},{name:'にんじん',amount:'1/2本'},{name:'大根',amount:'100g'},{name:'酢',amount:'大さじ2'},{name:'砂糖',amount:'大さじ1'},{name:'塩',amount:'少々'},{name:'マヨネーズ',amount:'大さじ2'},{name:'パクチー',amount:'適量'},{name:'唐辛子',amount:'お好みで'}],
    steps:['にんじん・大根を細切りにして酢・砂糖・塩で和え、なます（ドーチュア）を作っておく。','豚ひき肉をナンプラー・にんにくで味付けして炒める。','バゲットを縦に切り込みを入れてマヨネーズを塗る。','肉・なます・パクチー・唐辛子を挟んで完成。'],
    point:'なますは前日に作っておくと味が染みてさらに美味しい。'},
  'ナシゴレン':{ servings:'2人分', time:'15分',
    ingredients:[{name:'冷やご飯',amount:'2膳分'},{name:'エビ',amount:'8尾'},{name:'卵',amount:'2個'},{name:'玉ねぎ',amount:'1/4個'},{name:'にんにく',amount:'1かけ'},{name:'ナンプラー',amount:'大さじ1'},{name:'ケチャップマニス（甘口醤油）またはウスターソース',amount:'大さじ1'},{name:'サンバル（または唐辛子）',amount:'お好みで'},{name:'サラダ油',amount:'大さじ2'}],
    steps:['玉ねぎ・にんにくをみじん切りにする。','フライパンに油を熱し、玉ねぎ・にんにくを炒める。','エビを加えて炒め、ご飯を加えてほぐしながら炒める。','ナンプラー・ケチャップマニスで味付けし、卵を割り入れてスクランブル状にしながら混ぜる。','目玉焼きをのせて完成。'],
    point:'ケチャップマニスがない場合は醤油＋砂糖（1:0.5）で代用可能。'},
  'ルーローハン':{ servings:'3〜4人分', time:'60分',
    ingredients:[{name:'豚バラ肉（ブロック）',amount:'400g'},{name:'ゆで卵',amount:'4個'},{name:'醤油',amount:'大さじ4'},{name:'みりん',amount:'大さじ2'},{name:'砂糖',amount:'大さじ2'},{name:'紹興酒または酒',amount:'大さじ2'},{name:'五香粉',amount:'小さじ1/2'},{name:'にんにく',amount:'2かけ'},{name:'ご飯',amount:'4膳分'}],
    steps:['豚バラ肉を2cm角に切り、熱湯で下茹でしてアクを取る。','鍋に豚肉・醤油・みりん・砂糖・酒・五香粉・にんにくを入れて水をひたひたに注ぐ。','沸騰したら弱火にし、ゆで卵を加えて40〜50分煮込む。','ご飯の上に煮汁ごとたっぷりかけて完成。','青菜の炒め物やパクチーを添えるとさらに本格的。'],
    point:'五香粉が台湾らしさの決め手。なければシナモン少々で代用できる。'},
  'パンケーキ':{ servings:'2人分（6枚）', time:'25分',
    ingredients:[{name:'ホットケーキミックス',amount:'150g'},{name:'卵',amount:'1個'},{name:'牛乳',amount:'100ml'},{name:'バター',amount:'10g（溶かしておく）'},{name:'はちみつ・バター',amount:'お好みで'},{name:'メープルシロップ',amount:'適量'}],
    steps:['ホットケーキミックス・卵・牛乳・溶かしバターをボウルで混ぜる。','10分ほど生地を休ませる。','弱火で熱したフライパンに生地を丸く流し、表面に泡が出てきたら裏返す。','裏面も1〜2分焼いて完成。バター・はちみつ・メープルシロップを添える。'],
    point:'生地を休ませることで炭酸ガスが発生してふっくら仕上がる。弱火が焦がさないコツ。'},
  'プリン':{ servings:'4個分', time:'60分（冷やし時間含む）',
    ingredients:[{name:'卵',amount:'3個'},{name:'牛乳',amount:'400ml'},{name:'砂糖（プリン用）',amount:'50g'},{name:'バニラエッセンス',amount:'数滴'},{name:'砂糖（カラメル用）',amount:'50g'},{name:'水',amount:'大さじ2'},{name:'熱湯',amount:'大さじ2'}],
    steps:['カラメルを作る：砂糖と水を鍋で加熱し、茶色くなったら熱湯を加えてすばやく混ぜ、型に流す。','牛乳を温め、砂糖を溶かして粗熱を取る。','溶き卵にバニラ入りの牛乳を加えてよく混ぜ、こし器で漉す。','カラメルの型に注ぎ、湯煎で150℃のオーブンで40分焼く。','粗熱が取れたら冷蔵庫で2時間以上冷やして完成。'],
    point:'卵液を漉すとなめらかになる。蒸し焼きは低温でゆっくりが「す」が入らないコツ。'},
  'クレープ':{ servings:'8枚分', time:'30分',
    ingredients:[{name:'薄力粉',amount:'100g'},{name:'卵',amount:'2個'},{name:'牛乳',amount:'250ml'},{name:'砂糖',amount:'大さじ1'},{name:'バター（溶かす）',amount:'20g'},{name:'生クリーム',amount:'100ml'},{name:'フルーツ・ジャム',amount:'お好みで'}],
    steps:['薄力粉・砂糖・卵・牛乳を混ぜてなめらかな生地を作る。溶かしバターを加えてさらに混ぜる。','冷蔵庫で30分以上休ませる。','薄く油をひいたフライパンで薄く広げて両面焼く。','生クリームとフルーツを包んで完成。'],
    point:'生地を休ませることがパリパリ食感のカギ。フライパンは薄く油をひくだけでOK。'},
};

async function generateRecipe(mealName) {
  // 静的データから取得（Snack環境のCORS問題を回避）
  const recipe = RECIPES[mealName];
  if (recipe) return recipe;
  // データがない場合は汎用レシピを返す
  return {
    servings: '2人分',
    time: '30分',
    ingredients: [
      {name:'メインの食材', amount:'適量'},
      {name:'調味料', amount:'適量'},
    ],
    steps: [
      '食材を用意して切り分ける。',
      '下準備（下茹で・下味など）をする。',
      '調理する（炒める・煮る・焼くなど）。',
      '味を整えて盛り付けて完成。',
    ],
    point: 'お好みの調味料で味を調整してみてください。',
  };
}

// ─── コンポーネント：ジャンルチップ ──────────────────────────────────
function GenreChip({ genre, selected, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, selected && s.chipOn]} onPress={onPress} activeOpacity={0.75}>
      <Text style={s.chipEmoji}>{genre.emoji}</Text>
      <Text style={[s.chipLabel, selected && s.chipLabelOn]}>{genre.label}</Text>
    </TouchableOpacity>
  );
}

// ─── コンポーネント：レシピカード ────────────────────────────────────
function RecipeCard({ mealName }) {
  const [phase,  setPhase]  = useState('idle'); // idle|loading|done|error
  const [recipe, setRecipe] = useState(null);
  const [open,   setOpen]   = useState(false);

  const load = async () => {
    setPhase('loading'); setRecipe(null); setOpen(true);
    try {
      const r = await generateRecipe(mealName);
      setRecipe(r); setPhase('done');
    } catch {
      setPhase('error');
    }
  };

  return (
    <View style={s.recipeWrap}>
      {/* ヘッダー行 */}
      <View style={s.recipeHead}>
        <Text style={s.recipeTitle}>📋 レシピ</Text>
        {phase === 'idle' && (
          <TouchableOpacity style={s.recipeBtn} onPress={load}>
            <Text style={s.recipeBtnTxt}>✨ AIレシピを生成</Text>
          </TouchableOpacity>
        )}
        {phase === 'loading' && (
          <View style={s.loadRow}>
            <ActivityIndicator color={C.accent} size="small" />
            <Text style={s.loadTxt}>生成中...</Text>
          </View>
        )}
        {(phase === 'done' || phase === 'error') && (
          <TouchableOpacity style={s.recipeBtn} onPress={load}>
            <Text style={s.recipeBtnTxt}>🔄 再生成</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* エラー */}
      {phase === 'error' && (
        <View style={s.errBox}>
          <Text style={s.errTxt}>レシピの取得に失敗しました。もう一度お試しください。</Text>
        </View>
      )}

      {/* レシピ本文 */}
      {phase === 'done' && recipe && (
        <View style={s.recipeBody}>
          {/* メタ情報 */}
          <View style={s.recipeMeta}>
            <View style={s.recipeMetaItem}>
              <Text style={s.recipeMetaIcon}>👥</Text>
              <Text style={s.recipeMetaTxt}>{recipe.servings}</Text>
            </View>
            <View style={s.recipeMetaDivider} />
            <View style={s.recipeMetaItem}>
              <Text style={s.recipeMetaIcon}>⏱️</Text>
              <Text style={s.recipeMetaTxt}>{recipe.time}</Text>
            </View>
          </View>

          {/* 材料 */}
          <Text style={s.recipeSection}>🛒 材料</Text>
          <View style={s.ingredientGrid}>
            {(recipe.ingredients || []).map((ing, i) => (
              <View key={i} style={s.ingredientRow}>
                <Text style={s.ingredientName}>{ing.name}</Text>
                <Text style={s.ingredientAmount}>{ing.amount}</Text>
              </View>
            ))}
          </View>

          {/* 手順 */}
          <Text style={s.recipeSection}>👨‍🍳 作り方</Text>
          {(recipe.steps || []).map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNum}>
                <Text style={s.stepNumTxt}>{i + 1}</Text>
              </View>
              <Text style={s.stepTxt}>{step}</Text>
            </View>
          ))}

          {/* コツ */}
          {!!recipe.point && (
            <View style={s.pointBox}>
              <Text style={s.pointTxt}>💡 {recipe.point}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── コンポーネント：Google Maps 検索ボタン ──────────────────────────
function NearbyButton({ genreId, mealName, uLat, uLng }) {
  const kw      = GENRE_SEARCH[genreId] || mealName;
  const mapsUrl = buildGoogleMapsUrl(genreId, mealName, uLat, uLng);
  return (
    <View style={s.nearbyBtnWrap}>
      <TouchableOpacity style={s.gmapsBtn} onPress={() => Linking.openURL(mapsUrl)} activeOpacity={0.85}>
        <Text style={s.gmapsBtnEmoji}>🗺️</Text>
        <View>
          <Text style={s.gmapsBtnTitle}>Google マップで近くを検索</Text>
          <Text style={s.gmapsBtnSub}>「{kw}」で現在地周辺を表示</Text>
        </View>
        <Text style={s.gmapsBtnArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── マイメニュー追加モーダル ─────────────────────────────────────────
function MyMenuModal({ visible, onClose, onSave }) {
  const [name,    setName]    = useState('');
  const [genreId, setGenreId] = useState('japanese');
  const [type,    setType]    = useState('eating');

  const reset = () => { setName(''); setGenreId('japanese'); setType('eating'); };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('エラー', 'メニュー名を入力してください'); return; }
    const genre = GENRES.find(g => g.id === genreId);
    onSave({ name: name.trim(), emoji: genre.emoji, genreId, type, tips:'マイオリジナルメニュー！', isCustom: true });
    reset(); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <ScrollView>
        <View style={ms.sheet}>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>➕ マイメニューを追加</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={ms.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ジャンル選択 */}
          <Text style={ms.fieldLabel}>ジャンル</Text>
          <View style={ms.genreGrid}>
            {GENRES.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[ms.genreChip, genreId===g.id && ms.genreChipOn]}
                onPress={() => setGenreId(g.id)}
              >
                <Text style={ms.genreEmoji}>{g.emoji}</Text>
                <Text style={[ms.genreLabel, genreId===g.id && ms.genreLabelOn]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 自炊/外食 */}
          <Text style={ms.fieldLabel}>スタイル</Text>
          <View style={ms.typeRow}>
            <TouchableOpacity style={[ms.typeBtn, type==='cooking' && ms.typeBtnOn]} onPress={() => setType('cooking')}>
              <Text style={[ms.typeTxt, type==='cooking' && ms.typeTxtOn]}>🏠 自炊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ms.typeBtn, type==='eating' && ms.typeBtnOn]} onPress={() => setType('eating')}>
              <Text style={[ms.typeTxt, type==='eating' && ms.typeTxtOn]}>🚶 外食</Text>
            </TouchableOpacity>
          </View>

          {/* メニュー名 */}
          <Text style={ms.fieldLabel}>メニュー名 *</Text>
          <TextInput
            style={ms.input}
            placeholder="例：おばあちゃんの煮物"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
            maxLength={30}
          />

          {/* 保存ボタン */}
          <TouchableOpacity style={ms.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={ms.saveBtnTxt}>💾 追加する</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:        { backgroundColor:C.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:50, borderTopWidth:2, borderTopColor:C.accent },
  sheetHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  sheetTitle:   { fontSize:17, fontWeight:'700', color:C.text },
  closeBtn:     { fontSize:20, color:C.muted, padding:4 },
  fieldLabel:   { fontSize:11, fontWeight:'700', color:C.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, marginTop:16 },
  genreGrid:    { flexDirection:'row', flexWrap:'wrap', gap:7 },
  genreChip:    { width:'30%', paddingVertical:8, borderWidth:1.5, borderColor:C.border, borderRadius:10, backgroundColor:C.surface, alignItems:'center', gap:3 },
  genreChipOn:  { borderColor:C.accent, backgroundColor:'rgba(245,166,35,0.1)' },
  genreEmoji:   { fontSize:20 },
  genreLabel:   { fontSize:10, color:C.muted, textAlign:'center' },
  genreLabelOn: { color:C.accent },
  typeRow:      { flexDirection:'row', gap:10 },
  typeBtn:      { flex:1, paddingVertical:10, borderRadius:10, borderWidth:1.5, borderColor:C.border, alignItems:'center', backgroundColor:C.surface },
  typeBtnOn:    { borderColor:C.accent, backgroundColor:'rgba(245,166,35,0.1)' },
  typeTxt:      { fontSize:14, fontWeight:'700', color:C.muted },
  typeTxtOn:    { color:C.accent },
  input:        { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:10, padding:12, color:C.text, fontSize:14 },
  saveBtn:      { marginTop:20, paddingVertical:15, borderRadius:14, backgroundColor:C.accent, alignItems:'center' },
  saveBtnTxt:   { fontSize:16, fontWeight:'900', color:'#fff' },
});

// ─── メイン画面 ───────────────────────────────────────────────────────
export default function App() {
  const [style,     setStyle]     = useState('cooking');
  const [selected,  setSelected]  = useState(new Set(GENRES.map(g => g.id)));
  const [spinning,  setSpinning]  = useState(false);
  const [result,    setResult]    = useState(null);
  const [shopPhase, setShopPhase] = useState('idle');
  const [shops,     setShops]     = useState([]);
  const [shopErr,   setShopErr]   = useState('');
  const [uCoords,   setUCoords]   = useState(null);
  const [fbUrl,     setFbUrl]     = useState('');
  const [recipeKey, setRecipeKey] = useState(0);
  const [myMenus,   setMyMenus]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMyList,setShowMyList]= useState(false);
  const [menuMode,  setMenuMode]  = useState('normal'); // 'normal' | 'my' | 'both'
  const rollCount = useRef(0);

  // マイメニューをAsyncStorageから読み込む
  useEffect(() => {
    AsyncStorage.getItem('myMenus').then(val => {
      if (val) setMyMenus(JSON.parse(val));
    }).catch(() => {});
  }, []);

  // マイメニューを保存
  const saveMyMenus = (menus) => {
    setMyMenus(menus);
    AsyncStorage.setItem('myMenus', JSON.stringify(menus)).catch(() => {});
  };

  const addMyMenu = (menu) => saveMyMenus([...myMenus, { ...menu, id: Date.now().toString() }]);
  const deleteMyMenu = (id) => {
    Alert.alert('削除', 'このメニューを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => saveMyMenus(myMenus.filter(m => m.id !== id)) },
    ]);
  };

  // インタースティシャル広告の初期化
  const interstitial = useRef(
    InterstitialAd.createForAdRequest(INTERSTITIAL_ID, { requestNonPersonalizedAdsOnly: false })
  ).current;
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  useEffect(() => {
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load(); // 次の広告をプリロード
    });
    interstitial.load();
    return () => { unsubLoaded(); unsubClosed(); };
  }, []); // レシピリセット用

  const spinVal  = useRef(new Animated.Value(0)).current;
  const scaleVal = useRef(new Animated.Value(1)).current;
  const spinLoop = useRef(null);

  const toggleGenre = id => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) { if (next.size <= 1) return prev; next.delete(id); }
    else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(prev =>
    prev.size === GENRES.length ? new Set([GENRES[0].id]) : new Set(GENRES.map(g => g.id))
  );

  const roll = () => {
    if (spinning) return;
    const type = style === 'cooking' ? 'cooking' : 'eating';

    // 通常メニュー候補
    const arr     = [...selected];
    const genreId = arr[Math.floor(Math.random() * arr.length)];
    const genre   = GENRES.find(g => g.id === genreId);
    const regularOpts = menuMode !== 'my'
      ? (MEALS[genreId]?.[type] || MEALS[genreId]?.cooking || []).map(m => ({ ...m, genre, type, isCustom:false }))
      : [];

    // マイメニュー候補
    const customOpts = menuMode !== 'normal'
      ? myMenus.filter(m => m.type === type).map(m => {
          const g = GENRES.find(g2 => g2.id === m.genreId) || { id:'other', label:'その他', emoji:'🍽️', kw:'レストラン' };
          return { ...m, genre: g, type, isCustom:true };
        })
      : [];

    const allOpts = [...regularOpts, ...customOpts];
    if (!allOpts.length) {
      Alert.alert('メニューがありません', menuMode === 'my' ? 'マイメニューを追加してください' : 'ジャンルを選択してください');
      return;
    }

    const picked = allOpts[Math.floor(Math.random() * allOpts.length)];
    const pickedMeal = { name: picked.name, emoji: picked.emoji, tips: picked.tips || 'マイオリジナルメニュー！' };

    setSpinning(true);
    setResult(null);
    setShops([]); setShopPhase('idle'); setUCoords(null); setFbUrl('');
    setRecipeKey(k => k + 1);

    spinVal.setValue(0);
    spinLoop.current = Animated.loop(
      Animated.timing(spinVal, { toValue:1, duration:220, easing:Easing.linear, useNativeDriver:true })
    );
    spinLoop.current.start();

    setTimeout(() => {
      spinLoop.current?.stop();
      setSpinning(false);
      setResult({ meal: pickedMeal, genre: picked.genre, type, isCustom: picked.isCustom });
      scaleVal.setValue(0.7);
      Animated.spring(scaleVal, { toValue:1, speed:20, bounciness:14, useNativeDriver:true }).start();
      rollCount.current += 1;
      if (rollCount.current % 3 === 0 && interstitialLoaded) {
        setTimeout(() => interstitial.show(), 500);
      }
    }, 750);
  };

  const findNearby = async () => {
    if (!result) return;
    setShopPhase('loading'); setShopErr('');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setShopPhase('error');
      setShopErr('位置情報の使用が拒否されました。\n設定アプリから「位置情報」を許可してください。');
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUCoords({ lat, lng });
      setShopPhase('done');
    } catch {
      setShopPhase('error');
      setShopErr('位置情報の取得に失敗しました。\n通信環境をご確認ください。');
    }
  };

  const spinRot = spinVal.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] });
  const STYLE_OPTS = [
    { key:'cooking', label:'🏠 自炊' },
    { key:'eating',  label:'🚶 外食' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ヘッダー */}
        <View style={s.header}>
          <Text style={s.headerEmoji}>🍜🍣🍕🥗</Text>
          <Text style={s.headerTitle}>今日なに食べる？</Text>
          <Text style={s.headerSub}>迷ったらおまかせ！ランダムで決定します</Text>
        </View>

        {/* スタイル選択 */}
        <View style={s.section}>
          <Text style={s.label}>① スタイルを選ぶ</Text>
          <View style={s.toggleRow}>
            {STYLE_OPTS.map(o => (
              <TouchableOpacity key={o.key} style={[s.toggleBtn, style===o.key && s.toggleBtnOn]} onPress={() => setStyle(o.key)} activeOpacity={0.8}>
                <Text style={[s.toggleTxt, style===o.key && s.toggleTxtOn]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ジャンル選択 */}
        <View style={s.section}>
          <View style={s.genreHead}>
            <Text style={s.label}>② ジャンルを選ぶ（複数可）</Text>
            <TouchableOpacity style={s.allBtn} onPress={toggleAll}>
              <Text style={s.allBtnTxt}>すべて切替</Text>
            </TouchableOpacity>
          </View>
          <View style={s.chipGrid}>
            {GENRES.map(g => (
              <GenreChip key={g.id} genre={g} selected={selected.has(g.id)} onPress={() => toggleGenre(g.id)} />
            ))}
          </View>
        </View>

        {/* ロールボタン */}
        <TouchableOpacity style={[s.rollBtn, spinning && {opacity:0.6}]} onPress={roll} activeOpacity={0.85} disabled={spinning}>
          <Text style={s.rollTxt}>{spinning ? '決定中...' : '🎰 ランダムに決める！'}</Text>
        </TouchableOpacity>

        {/* マイメニューセクション */}
        <View style={s.myMenuSection}>
          {/* 切り替えスイッチ */}
          <Text style={s.label}>③ メニューの範囲</Text>
          <View style={s.modeRow}>
            {[
              { key:'normal', label:'通常のみ' },
              { key:'both',   label:'両方' },
              { key:'my',     label:'マイのみ' },
            ].map(o => (
              <TouchableOpacity
                key={o.key}
                style={[s.modeBtn, menuMode===o.key && s.modeBtnOn]}
                onPress={() => setMenuMode(o.key)}
              >
                <Text style={[s.modeTxt, menuMode===o.key && s.modeTxtOn]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* マイメニュー管理 */}
          <View style={s.myMenuHeader}>
            <Text style={s.myMenuTitle}>⭐ マイメニュー {myMenus.length > 0 ? `(${myMenus.length}件)` : ''}</Text>
            <View style={s.myMenuBtns}>
              {myMenus.length > 0 && (
                <TouchableOpacity style={s.myMenuBtn} onPress={() => setShowMyList(!showMyList)}>
                  <Text style={s.myMenuBtnTxt}>{showMyList ? '閉じる' : '一覧'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.myMenuBtn, s.myMenuBtnAccent]} onPress={() => setShowModal(true)}>
                <Text style={[s.myMenuBtnTxt, {color:'#fff'}]}>＋ 追加</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* マイメニュー一覧 */}
          {showMyList && myMenus.map(m => (
            <View key={m.id} style={s.myMenuItem}>
              <Text style={s.myMenuItemEmoji}>{m.emoji}</Text>
              <View style={s.myMenuItemInfo}>
                <Text style={s.myMenuItemName}>{m.name}</Text>
                <Text style={s.myMenuItemMeta}>{m.type==='cooking'?'🏠 自炊':'🚶 外食'} ・ {GENRES.find(g=>g.id===m.genreId)?.label||'その他'}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteMyMenu(m.id)}>
                <Text style={{fontSize:18}}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {myMenus.length === 0 && (
            <Text style={s.myMenuHint}>「＋ 追加」で自分だけのメニューを登録できます</Text>
          )}
        </View>

        {/* 結果カード */}
        {(spinning || result) && (
          <View style={s.resultCard}>
            <View style={s.badge}><Text style={s.badgeTxt}>✨ 決定！</Text></View>

            <Animated.Text style={[
              s.resultEmoji,
              spinning ? { transform:[{rotate:spinRot}] } : { transform:[{scale:scaleVal}] }
            ]}>
              {spinning ? '🎰' : result?.meal.emoji}
            </Animated.Text>

            {!spinning && result && (<>
              <Text style={s.resultName}>{result.meal.name}</Text>
              <View style={s.resultMeta}>
                <View style={[s.typeBadge, result.type==='cooking' ? s.typeCook : s.typeEat]}>
                  <Text style={[s.typeTxt, result.type==='cooking' ? s.typeCookTxt : s.typeEatTxt]}>
                    {result.type==='cooking' ? '🏠 自炊' : '🚶 外食'}
                  </Text>
                </View>
                <Text style={s.genreTag}>{result.genre.emoji} {result.genre.label}</Text>
              </View>
              <View style={s.tipsBox}>
                <Text style={s.tipsTxt}>💡 {result.meal.tips}</Text>
              </View>

              {/* ── 自炊 → AIレシピ ── */}
              {result.type === 'cooking' && (
                <RecipeCard
                  key={recipeKey}
                  mealName={result.meal.name}
                />
              )}

              {/* ── 外食 → 近くのお店 ── */}
              {result.type === 'eating' && (
                <View style={s.nearbySection}>
                  <View style={s.nearbyHead}>
                    <Text style={s.nearbyTitle}>📍 近くのお店</Text>
                    {shopPhase !== 'loading' && shopPhase !== 'done' && (
                      <TouchableOpacity style={s.findBtn} onPress={findNearby}>
                        <Text style={s.findBtnTxt}>📡 現在地を取得</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {shopPhase === 'loading' && (
                    <View style={s.loadRow}>
                      <ActivityIndicator color={C.accent} size="small" />
                      <Text style={s.loadTxt}>位置情報を取得中...</Text>
                    </View>
                  )}
                  {shopPhase === 'error' && (
                    <View style={s.errBox}><Text style={s.errTxt}>{shopErr}</Text></View>
                  )}
                  {shopPhase === 'done' && uCoords && (
                    <View>
                      <NearbyButton
                        genreId={result.genre.id}
                        mealName={result.meal.name}
                        uLat={uCoords.lat}
                        uLng={uCoords.lng}
                      />
                      <TouchableOpacity style={[s.findBtn, {marginTop:10, alignSelf:'flex-start'}]} onPress={findNearby}>
                        <Text style={s.findBtnTxt}>🔄 位置情報を更新</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {shopPhase === 'idle' && (
                    <Text style={s.nearbyHint}>ボタンを押すと現在地周辺の{result.genre.label}のお店をGoogle マップで検索します</Text>
                  )}
                </View>
              )}

              {/* もう一度 */}
              <TouchableOpacity style={s.againBtn} onPress={roll}>
                <Text style={s.againTxt}>🔄 もう一度ランダムで決める</Text>
              </TouchableOpacity>
            </>)}
          </View>
        )}

      </ScrollView>

      {/* マイメニュー追加モーダル */}
      <MyMenuModal visible={showModal} onClose={() => setShowModal(false)} onSave={addMyMenu} />

      {/* バナー広告（画面下部固定） */}
      <View style={s.bannerWrap}>
        <BannerAd
          unitId={BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── スタイル ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:C.bg },
  root:   { flex:1 },
  content:{ padding:18, paddingBottom:60 },

  header:     { alignItems:'center', marginBottom:28, marginTop:Platform.OS==='android'?12:4 },
  headerEmoji:{ fontSize:28, letterSpacing:6, marginBottom:8 },
  headerTitle:{ fontSize:26, fontWeight:'900', color:C.accent, marginBottom:4 },
  headerSub:  { fontSize:13, color:C.muted, fontWeight:'300' },

  section:{ marginBottom:18 },
  label:  { fontSize:11, fontWeight:'700', color:C.muted, letterSpacing:2, textTransform:'uppercase', marginBottom:10 },

  toggleRow:   { flexDirection:'row', gap:5, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:14, padding:4 },
  toggleBtn:   { flex:1, paddingVertical:11, borderRadius:10, alignItems:'center' },
  toggleBtnOn: { backgroundColor:C.accent, shadowColor:C.accent, shadowOpacity:0.35, shadowRadius:10, elevation:4 },
  toggleTxt:   { fontSize:13, fontWeight:'700', color:C.muted },
  toggleTxtOn: { color:'#fff' },

  genreHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  allBtn:    { borderWidth:1, borderColor:C.border, borderRadius:6, paddingVertical:4, paddingHorizontal:10 },
  allBtnTxt: { fontSize:11, color:C.muted },
  chipGrid:  { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:      { width:'30.5%', paddingVertical:10, borderWidth:1.5, borderColor:C.border, borderRadius:11, backgroundColor:C.card, alignItems:'center', gap:4 },
  chipOn:    { borderColor:C.accent, backgroundColor:'rgba(245,166,35,0.1)' },
  chipEmoji: { fontSize:22 },
  chipLabel: { fontSize:11, color:C.muted, textAlign:'center' },
  chipLabelOn:{ color:C.accent },

  rollBtn: { marginTop:8, paddingVertical:18, borderRadius:16, backgroundColor:C.accent, alignItems:'center', shadowColor:C.accent, shadowOpacity:0.4, shadowRadius:16, shadowOffset:{width:0,height:6}, elevation:8 },
  rollTxt: { fontSize:18, fontWeight:'900', color:'#fff' },

  resultCard: { marginTop:22, backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:20, padding:22, alignItems:'center', borderTopWidth:3, borderTopColor:C.accent },
  badge:      { backgroundColor:'rgba(245,166,35,0.12)', borderWidth:1, borderColor:'rgba(245,166,35,0.3)', borderRadius:99, paddingVertical:4, paddingHorizontal:14, marginBottom:14 },
  badgeTxt:   { fontSize:11, color:C.accent, fontWeight:'700', letterSpacing:2, textTransform:'uppercase' },
  resultEmoji:{ fontSize:68, marginBottom:8 },
  resultName: { fontSize:28, fontWeight:'900', color:C.text, marginBottom:8, textAlign:'center' },
  resultMeta: { flexDirection:'row', alignItems:'center', gap:8 },
  typeBadge:  { borderRadius:7, paddingVertical:3, paddingHorizontal:10, borderWidth:1 },
  typeCook:   { backgroundColor:'rgba(92,184,92,0.15)', borderColor:'rgba(92,184,92,0.3)' },
  typeEat:    { backgroundColor:'rgba(232,93,47,0.12)', borderColor:'rgba(232,93,47,0.3)' },
  typeTxt:    { fontSize:12, fontWeight:'700' },
  typeCookTxt:{ color:C.accent3 },
  typeEatTxt: { color:'#e8834f' },
  genreTag:   { fontSize:13, color:C.muted },
  tipsBox:    { marginTop:14, paddingTop:14, borderTopWidth:1, borderTopColor:C.border, width:'100%' },
  tipsTxt:    { fontSize:13, color:C.muted, lineHeight:20, textAlign:'center' },

  // ── レシピ ──
  recipeWrap: { width:'100%', marginTop:18, paddingTop:18, borderTopWidth:1, borderTopColor:C.border },
  recipeHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  recipeTitle:{ fontSize:15, fontWeight:'700', color:C.text },
  recipeBtn:  { borderWidth:1.5, borderColor:C.accent, borderRadius:10, paddingVertical:7, paddingHorizontal:13, backgroundColor:'rgba(245,166,35,0.08)' },
  recipeBtnTxt:{ fontSize:12, color:C.accent, fontWeight:'700' },

  recipeBody: { width:'100%' },
  recipeMeta: { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:10, padding:12, marginBottom:14 },
  recipeMetaItem:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6 },
  recipeMetaIcon:{ fontSize:16 },
  recipeMetaTxt: { fontSize:13, color:C.text, fontWeight:'600' },
  recipeMetaDivider:{ width:1, height:24, backgroundColor:C.border },

  recipeSection:{ fontSize:13, fontWeight:'700', color:C.accent, marginBottom:8, marginTop:4 },

  ingredientGrid:{ backgroundColor:C.surface, borderRadius:10, overflow:'hidden', marginBottom:14 },
  ingredientRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:9, paddingHorizontal:12, borderBottomWidth:1, borderBottomColor:C.border },
  ingredientName:{ fontSize:13, color:C.text, flex:1 },
  ingredientAmount:{ fontSize:13, color:C.accent, fontWeight:'700' },

  stepRow:   { flexDirection:'row', gap:10, marginBottom:10, alignItems:'flex-start' },
  stepNum:   { width:24, height:24, borderRadius:12, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepNumTxt:{ fontSize:12, fontWeight:'900', color:'#fff' },
  stepTxt:   { flex:1, fontSize:13, color:C.text, lineHeight:20 },

  pointBox:{ backgroundColor:'rgba(245,166,35,0.08)', borderWidth:1, borderColor:'rgba(245,166,35,0.25)', borderRadius:10, padding:12, marginTop:10 },
  pointTxt:{ fontSize:13, color:C.accent, lineHeight:20 },

  // ── 近くのお店 ──
  nearbySection:{ width:'100%', marginTop:18, paddingTop:18, borderTopWidth:1, borderTopColor:C.border },
  nearbyHead:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  nearbyTitle:  { fontSize:15, fontWeight:'700', color:C.text },
  findBtn:      { borderWidth:1.5, borderColor:C.accent, borderRadius:10, paddingVertical:7, paddingHorizontal:13, backgroundColor:'rgba(245,166,35,0.08)' },
  findBtnTxt:   { fontSize:12, color:C.accent, fontWeight:'700' },
  loadRow:      { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:12 },
  loadTxt:      { fontSize:13, color:C.muted },
  errBox:       { backgroundColor:'rgba(232,93,47,0.1)', borderWidth:1, borderColor:'rgba(232,93,47,0.3)', borderRadius:10, padding:12 },
  errTxt:       { fontSize:13, color:'#e8834f', lineHeight:20 },
  fbNote:       { fontSize:13, color:C.muted, marginBottom:10, lineHeight:20 },

  nearbyHint:   { fontSize:12, color:C.muted, lineHeight:18, marginTop:4 },

  // Google Maps ボタン
  nearbyBtnWrap:{ marginTop:4 },
  gmapsBtn:     { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.surface, borderWidth:1.5, borderColor:C.accent, borderRadius:14, padding:16 },
  gmapsBtnEmoji:{ fontSize:28 },
  gmapsBtnTitle:{ fontSize:14, fontWeight:'700', color:C.text, marginBottom:2 },
  gmapsBtnSub:  { fontSize:12, color:C.muted },
  gmapsBtnArrow:{ fontSize:22, color:C.accent, marginLeft:'auto', fontWeight:'700' },

  againBtn: { marginTop:16, width:'100%', borderWidth:1.5, borderColor:C.border, borderRadius:11, paddingVertical:13 },
  againTxt: { fontSize:14, color:C.muted, textAlign:'center' },

  // バナー広告
  bannerWrap: { alignItems:'center', backgroundColor:C.bg, paddingBottom:4 },

  // マイメニュー
  myMenuSection:  { marginTop:14, backgroundColor:C.card, borderRadius:14, padding:14, borderWidth:1, borderColor:C.border },
  modeRow:        { flexDirection:'row', gap:6, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:12, padding:4, marginBottom:14 },
  modeBtn:        { flex:1, paddingVertical:8, borderRadius:9, alignItems:'center' },
  modeBtnOn:      { backgroundColor:C.accent, shadowColor:C.accent, shadowOpacity:0.3, shadowRadius:8, elevation:3 },
  modeTxt:        { fontSize:12, fontWeight:'700', color:C.muted },
  modeTxtOn:      { color:'#fff' },
  myMenuHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  myMenuTitle:    { fontSize:13, fontWeight:'700', color:C.text },
  myMenuBtns:     { flexDirection:'row', gap:6 },
  myMenuBtn:      { borderWidth:1.5, borderColor:C.border, borderRadius:8, paddingVertical:5, paddingHorizontal:10 },
  myMenuBtnAccent:{ backgroundColor:C.accent, borderColor:C.accent },
  myMenuBtnTxt:   { fontSize:12, fontWeight:'700', color:C.muted },
  myMenuHint:     { fontSize:12, color:C.muted, lineHeight:18 },
  myMenuItem:     { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:C.surface, borderRadius:10, padding:10, marginBottom:6 },
  myMenuItemEmoji:{ fontSize:24 },
  myMenuItemInfo: { flex:1 },
  myMenuItemName: { fontSize:13, fontWeight:'700', color:C.text },
  myMenuItemMeta: { fontSize:11, color:C.muted, marginTop:2 },
});
