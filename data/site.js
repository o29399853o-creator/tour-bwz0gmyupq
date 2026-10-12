/* Site content. Texts and numbers come from the video captions (shot.json) and the user's confirmations (2026-10-09/10).
   2026-10-10 (user): no "related pages" cross links; one flat tour of 10 stops, always reached the same way. */
window.SITE={
  title:'花蓮機場主跑道整擴建工程',sub:'施工導覽',
  /* the tour: every page is one stop on this line (top bar, page transition, previous / next, ← →) */
  stops:[
    {route:'#/',label:'首頁',sub:'跑道總覽'},
    {route:'#/zone/1',label:'工區一',zone:1},
    {route:'#/zone/2',label:'工區二',zone:2},
    {route:'#/zone/3',label:'工區三',zone:3},
    {route:'#/zone/4',label:'工區四',zone:4},
    {route:'#/phase',label:'配合移航程序標線繪製',sub:'STEP1～6　跑道頭移設與標線'},
    {route:'#/control',label:'施工管制',sub:'木製圍籬與二號聯絡道封閉'},
    {route:'#/aids',label:'助航設施',sub:'邊燈迴路、末端燈、手孔、標誌牌'},
    {route:'#/insp',label:'監造查驗',sub:'查驗項目介紹：工區一～四、助航燈光'},   // B 2026-10-12
    {route:'#/film',label:'導覽影片',sub:'完整影片與章節'},
    {route:'#/making',label:'製作過程',sub:'AI 練習成果紀錄與資料來源'}],
  zones:{
    /* zones 1 / 2 are hammer-shaped (user 2026-10-11, photo): the runway width (45 m) plus a head where both sides widen by 15 m at the
       zone-3 end, STA 460～512.65 and 2238.384～2296.48 (references/finished_pavement_design_v32.json extension_ranges, sheets F-01 / F-02) */
    1:{name:'工區一',cap:'03 端水泥混凝土鋪面重建',span:[0,512.65],part:'core',head:[460,512.65],lvl:0,
       facts:[['範圍','STA 0K+000～0K+512.65'],['面層','水泥混凝土（PCC）40 cm'],['基層','水泥處理級配 30 cm']],
       section:[{n:'水泥處理級配',cm:30,c:'#a8987a'},{n:'水泥混凝土（PCC）',cm:40,c:'#b9c3cc'}],total:'合計 70 cm'},
    2:{name:'工區二',cap:'21 端水泥混凝土鋪面重建',span:[2238.384,2755.244],part:'core',head:[2238.384,2296.48],lvl:0,
       facts:[['範圍','STA 2K+238.384～2K+755.244'],['面層','水泥混凝土（PCC）40 cm'],['基層','水泥處理級配 30 cm']],
       section:[{n:'水泥處理級配',cm:30,c:'#a8987a'},{n:'水泥混凝土（PCC）',cm:40,c:'#b9c3cc'}],total:'合計 70 cm'},
    3:{name:'工區三',cap:'跑道兩側瀝青擴建',span:[512.65,2238.384],part:'sides',lvl:1,
       facts:[['範圍','STA 0K+512.65～2K+238.384'],['寬度','跑道兩側各 15 m'],['面層','瀝青 15 cm'],['基層','水泥處理 15 cm'],['底層','碎石級配 30 cm'],['聯絡道口','2、3、4 號自跑道邊線外 30 m 一併擴建']],
       section:[{n:'碎石級配',cm:30,c:'#7a6650'},{n:'水泥處理級配',cm:15,c:'#a8987a'},{n:'瀝青混凝土',cm:15,c:'#2b2f35'}],total:'總厚 60 cm',
       /* taxiway mouths 2-4 (user 2026-10-10: zone 3 takes in the taxiway mouths 30 m beyond the runway edge, like the pink stickers):
          [STA from, STA to, side (-1 west = top of the drawings, +1 east = bottom), metres beyond the 15 m widening]
          from outputs/wz3_mouths_20261001/WZ3_MOUTHS.json (lateral 37.5-52.5 m; 4 east to 57.5 m with the PC row) */
       mouths:[[653.8,683.9,-1,15],[652.4,683.8,1,15],[1384.3,1418.1,-1,15],[1382.9,1417.3,1,15],[2067.8,2098.6,-1,15],[2065.3,2097.2,1,20]]},
    4:{name:'工區四',cap:'既有跑道瀝青整建',span:[512.65,2238.384],part:'core',lvl:1,
       facts:[['範圍','STA 0K+512.65～2K+238.384'],['寬度','既有跑道全寬 45 m'],['面層','改質瀝青 20 cm'],['接縫','玻璃纖維反射裂縫抑制網']],
       section:[{n:'既有級配粒料底層',cm:25,c:'#6d5c48',dash:1},{n:'既有水泥混凝土底層',cm:25,c:'#8e979f',dash:1},{n:'反射裂縫抑制網（接縫處 1 m）',cm:3,c:'#e8b84a',mesh:1},{n:'密級配改質瀝青混凝土',cm:20,c:'#24282d'}],
       total:'',note:'既有底層厚度圖說未列，以虛線示意；抑制網的畫面厚度為示意。'}},
  /* material notes for the cross-section hover (wording from the video captions) */
  materials:{'水泥處理級配':'基層','水泥混凝土（PCC）':'面層','碎石級配':'底層','瀝青混凝土':'面層','既有級配粒料底層':'既有，厚度圖說未列',
    '既有水泥混凝土底層':'刨除既有瀝青後露出','反射裂縫抑制網（接縫處 1 m）':'玻璃纖維，約每 7 m 一道','密級配改質瀝青混凝土':'加鋪 20 cm，底部含反射裂縫抑制材'},
  /* zone 3: S06 cover-plate cycle, one state per caption (captions[cap]) */
  wz3:{kick:'施工',title:'覆工板施工循環',lead:'示範段 STA 0K+770～0K+791（工區三東側）。一步一步看施工期間怎麼讓跑道照常開放。',
    states:[{short:'開挖',cap:0},{short:'碎石級配',cap:1},{short:'水泥處理級配',cap:2},{short:'覆工板鋪設',cap:3},
      {short:'覆工板規格',title:'覆工板規格',cap:4},{short:'暫時開放',titleCap:4,cap:5}],   // user 2026-10-10: 5 = plate spec, 6 = temporary opening
    notes:{'鋼製覆工板　3 m × 1.5 m × 15 cm':'此段 70 片（5 排 × 14 列），由上往下逐片鋪設。'}},
  /* zones 1 and 2: S03c / S04c (user 2026-10-12, 「工區二也一併做」) — a block pulled out of the PCC pavement: texture, joints, sealing (F-24) */
  pcc:{kick:'施工',title:'從掃紋到填縫',lead:'從道面拉出一塊來看。點下方的施工步驟、點畫面或按 → ，看下一個步驟。',
    leadTouch:'從道面拉出一塊來看。點下方的施工步驟、點畫面或左右滑動，看下一個步驟。',
    states:[{short:'掃紋'},{short:'導裂'},{short:'擴縫'},{short:'導圓角'},{short:'墊條＋填縫'},{short:'綴縫筋'},{short:'完成'}],   // user 2026-10-12: 掃紋 → 導裂 → 擴縫 → 導圓角 → 墊條＋填縫;「拉出一塊那格拿掉」
    notes:{'導裂深 T/4（10 cm）':'導裂（第一次鋸切）的寬度圖說未標示，模型以 5 mm 示意；深度依 F-24 為 T/4。',
      '掃紋（剖面放大示意，實深 1～1.5 mm）':'剖面上的紋路深度放大約 3 倍，方便看出；實際平均深度 1～1.5 mm（施工規範第 02751 章 3.7.1）。',
      '版塊 寬 4.5 m × 長 5.3 m（F-21）':'尺寸依細部設計圖說 F-21；模型畫面的分塊線為示意。',
      '綴縫筋 Ø30 mm，L＝51 cm @30 cm':'依 F-24：光面鋼棒，一端在施工前塗潤滑油脂。F-21：縱向施工縫含綴縫鋼棒，橫向縮縫無綴縫鋼棒。'},
    quote:'依 F-21 剛性道面分塊詳圖、F-24 剛性道面接縫詳圖（填縫詳圖）與施工規範第 02751 章；接縫在跑道上的位置為示意。'},
  /* zone 4: S07b */
  wz4:{kick:'施工',title:'一層層看施工',lead:'點下方的施工步驟、點畫面或按 → ，模型會變成下一個階段。',leadTouch:'點下方的施工步驟、點畫面或左右滑動，模型會變成下一個階段。',
    quote:'依 F-23 附註：「於接縫設置寬度1M寬玻璃纖維反射裂縫抑制網。約每7M一道。」',
    notes:{'反射裂縫抑制網（玻璃纖維，寬 1 m）':'依 F-23 附註：「於接縫設置寬度1M寬玻璃纖維反射裂縫抑制網。約每7M一道。」',
      '接縫處（約每 7 m 一道）':'接縫位置為示意，非實測。','既有水泥混凝土版塊':'刨除既有瀝青後露出的既有水泥混凝土底層，深色線為版塊接縫（位置為示意）。',
      '20 cm 密級配改質瀝青混凝土':'加鋪 20 cm 密級配改質瀝青混凝土；F-03 標示「(底部含反射裂縫抑制材)」。'}},
  stats:[
    {v:2755,u:'m',l:'跑道 STA 0K+000～2K+755'},
    {v:195,u:'座',l:'助航燈光手孔'},
    {v:198,u:'盞',l:'跑道邊燈（R1 100＋R3 98）'},
    {v:70,u:'片',l:'覆工板（示範段 21 m）'}],
  layers:{
    zones:{label:'工區',info:'滑過色帶看預覽，點一下進入工區',infoTouch:'點跑道上的色帶，或下方的工區按鈕進入工區'},
    relo:{label:'移航跑道頭',info:'封閉施工時跑道頭移設：03 端移至 STA 0K+712（STEP2）、21 端移至 STA 2K+043（STEP6）'},
    ctrl:{label:'施工管制',info:'工區一木製圍籬 24 小時圍設；二號聯絡道 X 前圍籬 17:00～21:00 圍設，21:00 撤收供戰機使用'},
    aids:{label:'助航設施',info:'跑道邊燈 R1、R3 兩迴路交錯，每側兩端各 21 盞黃/白；跑道頭末端燈綠光朝進場航機、紅光朝跑道'}},
  /* 施工階段: the runway diagram per step (from the S08 / S09 captions) and the top-view pair shown for it.
     2026-10-11 user: STEP1 / STEP5 also cover the two edge lines up to the new threshold (0K+712 / 2K+043), so the red reaches it
     2026-10-12 user: "第五站，施工前拿掉" — the steps start at STEP1 (top_before stays in assets, unused) */
  phase:[
    {k:'STEP1',img:['top_mark','top_black'],thr03:0,thr21:2755.244,red:[[0,712]],lab:['紅色＝要以黑漆覆蓋','覆蓋後']},
    {k:'STEP2',img:['top_black','top_after'],thr03:712,thr21:2755.244,closed:[0,512.65],x:[194,494],chev:[512.65,712],lab:['STEP1 覆蓋後','新設移航標線'],obl:'obl03'},
    {k:'STEP3',img:['t3_mark','t3_black'],thr03:712,thr21:2755.244,closed:[0,512.65],x:[194,494],chev:[512.65,712],red:[[512.65,760]],lab:['紅色＝要以黑漆抹除','抹除後']},
    {k:'STEP4',img:['t3_black','t4_new'],thr03:0,thr21:2755.244,lab:['STEP3 抹除後','03 端標線復原']},
    {k:'STEP5',img:['t5_mark','t5_black'],thr03:0,thr21:2755.244,red:[[2043,2755.244]],lab:['紅色＝要以黑漆覆蓋','覆蓋後']},
    {k:'STEP6',img:['t5_black','t6_new'],thr03:0,thr21:2043,closed:[2238.384,2755.244],x:[2256,2557],chev:[2043,2238.384],lab:['STEP5 覆蓋後','新設移航標線'],obl:'obl21'}],
  /* 施工管制: 24 h clock rings */
  /* user 2026-10-10: zone-1 barriers stay up all day; only the ones in front of taxiway 2 come down (up 17:00-21:00); no counts */
  rings:[{h0:0,h1:24,col:'#ff6b5e',name:'工區一　木製圍籬（03 端）',t:'24 小時圍設',media:'barrier'},
         {h0:17,h1:21,col:'#f2bf1a',name:'二號聯絡道　X 前木製圍籬',t:'17:00～21:00 圍設，21:00 撤收供戰機使用',media:'taxiway'}],
  /* end lights: a model video in place of the 2026-10-11 still (user 2026-10-13: "左邊的照片如果改跟右邊動畫同步，用模型畫面算出影片"),
     made by work/endlight_video_20261013/render_endlights.py (r6) + make_mp4.py web 3. The plane in G.EndLights follows the video's clock
     on the same camera timeline: approach t1 s on a 3 deg glide path, braking V1*(1-u^n) for t2 s to a stop at sEnd (255 m short of the
     21 end), hold; the video starts at camera time off s (user: "從第五秒開始播就好" -> "改剩3秒"). */
  endVideo:{mp4:'assets/aids/endlights.mp4',poster:'assets/aids/endlights_poster.jpg',
    cap:'模型畫面：進場看到 03 端的綠光，觸地煞停後看到 21 端的紅光',off:3,t1:6,t2:10,hold:1.5,n:2,sEnd:2500},
  signs:{title:'標誌牌',sub:'資訊指示牌（黑底黃字）與千呎牌（跑道剩餘距離，千呎）。'},
  /* PAPI: wording and numbers from drawing E-38 臨時PAPI 設置詳圖（施工階段一／階段二）(user 2026-10-10: "PAPI運作方式請參考圖說E-38") */
  papi:{title:'精確進場滑降指示燈（PAPI）',
    lead:"跑道旁一排 4 盞燈（A～D），每盞有自己的仰角設定：飛機在設定角以上看到白光、以下看到紅光。3° 進場斜面的設定為 A 2°30'、B 2°50'、C 3°10'、D 3°30'，看到幾盞白、幾盞紅，就知道自己飛得太高還是太低。",
    units:[['A',2.5,"2°30'"],['B',2+50/60,"2°50'"],['C',3+10/60,"3°10'"],['D',3.5,"3°30'"]],
    states:[['TOO HIGH','太高'],['SLIGHTLY HIGH','稍高'],['ON CORRECT APPROACH PATH','保持高度'],['SLIGHTLY LOW','稍低'],['TOO LOW','太低']],   // by number of white units 4..0
    facts:[['排列','A～D 一排，D 最靠近跑道；D 距道肩邊線 15 m，燈與燈間距 9 m'],['基座','臨時基礎座 1.5 m × 1.5 m'],['安裝','燈箱在同一水平線上，中心點與跑道中心線等高，並與跑道中心線垂直'],
      ['施工期間','配合跑道頭移設重新建置臨時 PAPI：03 臨時跑道（施工階段一）、21 臨時跑道（施工階段二）']],
    src:'依圖說 E-38　臨時PAPI 設置詳圖（施工階段一／階段二）'},
  chapterTitles:{S07b:'工區四　一層層看施工',S03b:'木製圍籬特寫　工區一（03 端）'},
  /* 製作過程 */
  making:{
    flow:[['Blender 模型','依圖說配置跑道、標線、燈具、分層'],['算圖影格','Blender 5.1 背景算圖，每秒 24 格'],['影片合成','Python 疊字幕與標註，輸出 H.264'],['網站互動','影格變成可以點的狀態，不跑 3D']],
    /* before 09-18: user 2026-10-11 supplied 12 entries; merged to 6 with the user (no MSFS name, 9/17 left out) */
    timeline:[['2026-07-13～16','施工視覺化原型','工區三兩側擴建、工區四既有跑道整建，六階段 Blender 示意'],['2026-07-16～23','機場資料解析','機場配置、模型與物件座標'],
      ['2026-08-03～14','工程分層與正式場景','開挖、級配、水泥處理層、瀝青層；8/12 第一版正式核准成果'],['2026-08-19～27','寫實化與空照校準','開挖動畫、陰影、空照定位、草地'],
      ['2026-09-04～10','四工區與完工配置','工區一至四施工層、完工跑道、光影基準與寫實材質'],['2026-09-11～14','機場周邊精修','航站與機棚、道路圍牆、場區材質、燈具與滑行道標誌牌'],
      ['2026-09-18','燈具建置','跑道邊燈、末端燈、PAPI 等'],['2026-09-22','跑道周邊附屬設施',''],['2026-09-23～29','道路定位與周邊視覺修正',''],
      ['2026-10-01','日檔：邊燈迴路、新設指示牌',''],['2026-10-02','正式施工導覽影片流程',''],['2026-10-06','影片 v3：移航俯視全景',''],
      ['2026-10-07～08','木製圍籬、二號聯絡道黃色 X、覆工板分鏡改版、傍晚燈光',''],['2026-10-09','新片頭動畫、工區四接縫示意、網站規劃與第一期',''],
      ['2026-10-10','影片 v6 完成並驗收合格','4427 格、約 3 分 4 秒；網站全站完成']],
    tools:[['Blender 5.1','模型、算圖、影片輸出（背景執行）'],['Python／Pillow','影格合成、字幕、標註、網站素材'],['HTML／CSS／JavaScript','網站本身，不用外部套件，可離線開啟'],['Claude、Codex','撰寫與檢查腳本、網站程式；所有輸出由承辦人驗收']],
    sources:[['模型說明','模型為示意，位置依設計展示配準，非測量成果。'],
      ['影片字幕引用的圖號','D-13～D-16、D-17-1、D-22～D-31（移航標線）；F-03、F-23（工區四鋪面與抑制網）'],
      ['飛機模型','"Boeing 747-100" by Marine, CC BY 4.0；"Boeing-787- Dreamliner" by themaker845, CC BY 4.0；"F-16 Fighting Falcon - Fighter Jet - Free" by bohmerang, CC BY-NC-SA 4.0（非商用）'],
      ['版本','網站 2026-10-10 全站版；導覽影片 v6']]}
};
