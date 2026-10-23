// Hand-directed pixel caricatures. Geometry is shared; faces and silhouettes are not.
// Each fighter has a head palette, a skin/clothes palette and a shirt/accent palette.
const specs=[
 {hair:'lion',face:'lean',brow:'angry',nose:21,width:13,wear:'leather',accent:'#81737d',suit:'#302d36',skin:'#edba88',shirt:'#2a2635'},
 {hair:'layers',face:'oval',brow:'arch',nose:20,width:15,wear:'blazer',jewel:true,accent:'#e4bd64',skin:'#f1bb96'},
 {hair:'recede',face:'square',nose:21,width:15,wear:'open',smile:true,accent:'#91c6de',suit:'#77aecb',skin:'#eebc96'},
 {hair:'bob',face:'round',nose:20,width:20,wear:'tunic',glasses:true,jewel:true,accent:'#b9974e',skin:'#f5caa7'},
 {hair:'bun',face:'oval',nose:20,width:14,wear:'dress',jewel:true,accent:'#9cbfd0',skin:'#f3c7a1'},
 {hair:'messy',face:'wide',nose:21,width:17,wear:'jacket',beard:'full',prop:'mate',accent:'#d0c5a0',skin:'#dba579'},
 {hair:'helmetbob',face:'square',nose:21,width:16,wear:'jacket',accent:'#e1e5e3',skin:'#eabb99'},
 {hair:'hardhat',face:'square',nose:20,width:15,wear:'vest',smile:true,prop:'brick',suit:'#436681',accent:'#daa347',skin:'#e7ae85'},
 {hair:'slickgrey',face:'wide',nose:21,width:18,wear:'sash',smile:true,accent:'#8dc4df',skin:'#e1b693'},
 {hair:'sideburns',face:'square',nose:21,width:15,wear:'suit',smile:true,accent:'#8b2438',skin:'#d9a278'},
 {hair:'greywings',face:'wide',nose:20,width:17,wear:'suit',moustache:true,accent:'#9c4841',skin:'#ebba98'},
 {hair:'partedgrey',face:'long',nose:21,width:14,wear:'suit',tall:true,accent:'#716c9f',skin:'#e6b79c'},
 {hair:'thin',face:'round',nose:21,width:20,wear:'open',brow:'heavy',accent:'#9da8a4',skin:'#dca782'},
 {hair:'windgrey',face:'long',nose:23,width:16,wear:'loosetie',eyes:'offset',accent:'#6c9cc5',skin:'#e4b48e'},
 {hair:'sweptgrey',face:'round',nose:21,width:19,wear:'suit',moustache:true,accent:'#94c4d8',skin:'#e8b694'},
 {hair:'parted',face:'square',nose:20,width:16,wear:'suit',brow:'arch',smile:true,accent:'#466ba1',skin:'#e6b18c'},
 {hair:'fringe',face:'lean',nose:20,width:13,wear:'open',prop:'book',accent:'#7eb8ce',suit:'#4d7fa2',skin:'#ecc29e'},
 {hair:'bald',face:'long',nose:20,width:13,wear:'open',smile:true,accent:'#bdc8cb',skin:'#e6b28d'},
 {hair:'silverpart',face:'long',nose:22,width:15,wear:'suit',prop:'bond',accent:'#99bcae',skin:'#dfb18b'},
 {hair:'bald',face:'wide',nose:21,width:19,wear:'suit',brow:'heavy',accent:'#a698c2',skin:'#e7b18d'},
 {hair:'blondewave',face:'oval',nose:20,width:14,wear:'blazer',accent:'#e3c1a4',shirt:'#352e3d',skin:'#f2c6a2'},
 {hair:'swept',face:'lean',nose:21,width:14,wear:'jacket',beard:'short',prop:'sign',accent:'#b33e4b',shirt:'#b33e4b',skin:'#d9a276'},
 {hair:'recede',face:'square',nose:22,width:19,wear:'rolled',moustache:true,brow:'heavy',prop:'glove',accent:'#487566',skin:'#d6a37c'},
 {hair:'short',face:'long',nose:21,width:16,wear:'sport',smile:true,accent:'#eee6ce',skin:'#cf986f'},
 {hair:'curls',face:'long',nose:22,width:12,wear:'open',tall:true,accent:'#d5b69a',skin:'#e6b88f'},
 {hair:'sidepart',face:'wide',nose:20,width:17,wear:'open',beard:'salt',accent:'#c8cfd4',skin:'#d7a07a'},
 {hair:'longwave',face:'oval',nose:21,width:14,wear:'blazer',accent:'#e0ddd6',skin:'#eec29f'},
 {hair:'slickgrey',face:'square',nose:22,width:20,wear:'suit',brow:'angry',prop:'case',accent:'#b1afa2',skin:'#e2b38e'},
 {hair:'bandana',face:'wide',nose:21,width:21,wear:'vest',beard:'full',prop:'brick',accent:'#d8bb95',skin:'#ce966e'},
 {hair:'cap',face:'square',nose:20,width:17,wear:'uniform',brow:'heavy',prop:'baton',accent:'#c6af62',skin:'#d5a17d'},
 {hair:'wavy',face:'lean',nose:21,width:16,wear:'suit',beard:'full',accent:'#a7bdcb',skin:'#dca67f'},
 {hair:'duck',face:'duck',width:22,wear:'duck',accent:'#82c8df',skin:'#f3a936',suit:'#f5cf47',ink:'#77502b',shirt:'#f4edc8'}
];

function surface(){
 const p=Array.from({length:48},()=>Array(24).fill(0));
 const dot=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&x<24&&y>=0&&y<48)p[y][x]=c;};
 const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)dot(i,j,c);};
 const line=(x,y,X,Y,c)=>{x=Math.round(x);y=Math.round(y);X=Math.round(X);Y=Math.round(Y);let dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,e=dx+dy;for(;;){dot(x,y,c);if(x===X&&y===Y)break;let a=2*e;if(a>=dy){e+=dy;x+=sx;}if(a<=dx){e+=dx;y+=sy;}}};
 const oval=(x,y,rx,ry,c)=>{for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if(i*i*ry*ry+j*j*rx*rx<=rx*rx*ry*ry)dot(x+i,y+j,c);};
 const poly=(pts,c)=>{for(let y=0;y<48;y++){const a=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const [x1,y1]=pts[j],[x2,y2]=pts[i];if((y1>y)!==(y2>y))a.push(x1+(y-y1)*(x2-x1)/(y2-y1));}a.sort((a,b)=>a-b);for(let i=0;i<a.length;i+=2)for(let x=Math.ceil(a[i]);x<=Math.floor(a[i+1]);x++)dot(x,y,c);}for(let i=0;i<pts.length;i++)line(...pts[i],...pts[(i+1)%pts.length],c);};
 return {p,dot,rect,line,oval,poly};
}

export function characterPalettes(r,i){
 const s=specs[i],ink=s.ink??'#252436',skin=s.skin,body=s.suit??r[5];
 let hair=r[6];
 const grey={greywings:'#a1a3a1',slickgrey:i===8?'#747a7d':'#b5b6b2',partedgrey:'#a9aaa5',sweptgrey:'#b9bcb7',windgrey:'#9d9280',silverpart:'#9a917f'};
 hair=grey[s.hair]??hair;
 if(s.hair==='hardhat')hair='#ebbd49';
 if(s.hair==='bandana')hair='#b23f43';
 if(s.hair==='cap')hair='#477c69';
 const bg='#111a35';
 return [bg,hair,ink,skin,bg,body,ink,skin,bg,body,s.accent,s.shirt??'#eee3cc'];
}

export function fighterArt(r,frame,id){
 const s=specs[id],c=surface(),{p,dot,rect,line,oval,poly}=c;
 const crouch=frame===4?7:0,bottom=s.tall?47:46;
 if(s.hair==='duck'){
  oval(11,30,11,12,2);oval(11,29,10,11,1);poly([[0,24],[5,27],[4,33],[0,31]],1);
  oval(12,9,9,8,2);oval(12,8,8,7,1);rect(17,8,7,4,3);line(18,11,23,11,2);rect(15,5,2,2,2);rect(9,15,6,8,1);
  line(6,23,18,33,3);line(7,23,19,33,3);line(9,26,16,31,2);
  line(5,38,3,42,3);rect(1,42,7,2,3);rect(14,41,8,3,3);oval(7,31,4,5,2);oval(7,30,3,4,1);
  if(frame===2){rect(17,22,7,4,1);rect(21,21,3,5,3);}if(frame===3){rect(16,36,8,5,3);}
  if(frame===4){for(let y=37;y<48;y++)p[y].fill(0);rect(2,37,7,2,3);rect(14,37,8,2,3);}
  return p;
 }
 // Skull silhouette: deliberately different jaws, cheek widths and noses.
 const face={round:[[4,5],[7,2],[15,1],[19,4],[20,10],[18,14],[14,16],[8,15],[4,12]],
  wide:[[4,4],[8,2],[16,2],[19,5],[19,11],[17,15],[8,15],[4,11]],
  square:[[5,4],[8,2],[16,2],[19,5],[19,13],[16,15],[8,15],[5,12]],
  long:[[7,3],[11,1],[16,2],[18,5],[18,12],[16,16],[11,16],[8,13],[6,8]],
  lean:[[6,4],[10,1],[16,2],[19,6],[18,12],[15,16],[10,14],[6,10]],
  oval:[[6,4],[9,2],[15,2],[18,5],[19,10],[17,14],[12,16],[8,13],[5,8]]}[s.face];
 // Hair behind the face remains a separate silhouette.
 const long=['layers','bob','helmetbob','blondewave','longwave'].includes(s.hair);
 if(long){oval(11,8,11,9,2);oval(11,7,10,8,1);rect(2,6,4,s.hair==='bob'?11:17,2);rect(19,6,3,s.hair==='bob'?10:16,2);}
 if(['lion','curls','fringe','wavy','messy','swept'].includes(s.hair)){oval(11,5,11,7,2);oval(11,4,10,6,1);}
 poly(face,2);
 const inner=face.map(([x,y])=>[Math.round(12+(x-12)*.84),Math.round(8+(y-8)*.83)]);poly(inner,3);
 // A visible ear, cheek edge, asymmetric three-quarter nose.
 rect(4,8,3,4,3);dot(4,9,2);poly([[17,7],[s.nose,9],[s.nose-1,11],[17,11]],3);dot(s.nose-1,11,2);
 if(s.face==='round'||s.face==='wide')line(6,12,8,13,2);
 switch(s.hair){
 case 'lion':
  poly([[1,3],[4,0],[8,1],[11,0],[15,1],[18,0],[21,3],[23,4],[21,7],[19,6],[17,5],[16,8],[13,5],[10,7],[8,5],[6,7],[4,5],[4,11],[2,10]],2);
  poly([[2,3],[5,1],[8,2],[11,1],[15,2],[18,1],[20,4],[21,5],[18,4],[17,6],[14,4],[11,5],[8,3],[6,5],[3,6]],1);rect(3,7,3,6,1);rect(5,12,2,3,2);break;
 case 'layers':case 'longwave':case 'blondewave':
  poly([[3,5],[6,0],[13,0],[19,2],[21,5],[18,7],[16,4],[11,4],[8,7],[5,10],[3,14]],1);line(5,4,10,2,2);line(18,4,20,8,2);rect(2,13,3,7,2);rect(19,12,3,9,2);break;
 case 'bob':
  poly([[2,5],[6,0],[16,0],[21,4],[22,12],[20,16],[18,12],[18,5],[12,3],[7,5],[5,14],[2,12]],1);line(4,6,4,12,2);break;
 case 'helmetbob':
  rect(3,5,3,12,1);rect(19,6,3,11,1);poly([[4,5],[7,2],[16,2],[20,5],[16,5],[11,4],[7,7]],1);
  line(4,2,18,2,2);rect(3,3,18,2,2);dot(11,1,3);break;
 case 'bun':
  oval(3,9,3,4,2);oval(3,8,2,3,1);poly([[5,5],[7,1],[15,0],[19,3],[18,5],[14,3],[9,4],[6,7]],1);line(7,3,14,2,2);break;
 case 'hardhat':
  rect(5,5,3,3,2);rect(17,5,3,3,2);oval(11,2,9,4,2);oval(11,2,8,3,1);rect(1,4,22,2,1);line(4,5,20,5,2);rect(11,0,2,4,3);break;
 case 'sideburns':
  poly([[4,5],[6,1],[10,0],[18,1],[20,4],[16,5],[12,3],[8,4],[7,13],[4,14]],1);rect(5,9,3,6,1);rect(17,12,2,3,1);break;
 case 'bald':
  line(8,2,15,1,3);dot(18,5,2);rect(5,7,2,4,3);if(s.face==='wide'){line(8,4,14,4,2);dot(7,5,3);}break;
 case 'thin':
  line(7,3,15,2,1);rect(4,5,3,5,1);rect(18,4,2,4,1);break;
 case 'recede':
  poly([[5,5],[6,2],[10,1],[12,2],[10,4],[7,4],[7,8],[5,9]],1);poly([[14,2],[18,2],[20,5],[18,6],[17,4]],1);break;
 case 'curls':
  for(const [x,y] of [[3,3],[7,1],[11,2],[15,0],[19,2],[21,5],[5,6]]){oval(x,y,3,3,2);oval(x,y,2,2,1);}rect(3,7,3,5,1);break;
 case 'bandana':
  poly([[4,3],[9,0],[17,1],[20,5],[15,4],[8,5]],2);rect(3,4,18,3,1);rect(0,6,5,2,1);line(1,8,0,11,1);dot(13,5,3);break;
 case 'cap':
  poly([[4,3],[7,0],[17,0],[20,4]],1);rect(3,4,20,2,2);rect(10,2,4,2,3);rect(5,6,2,3,2);break;
 case 'fringe':
  poly([[3,4],[6,0],[15,0],[20,3],[21,6],[17,6],[13,3],[12,7],[9,9],[10,4],[6,6],[5,11],[3,10]],1);line(6,2,13,1,2);break;
 case 'windgrey':
  poly([[5,5],[7,1],[13,0],[19,3],[20,5],[16,4],[13,3],[9,5],[7,8],[5,9]],1);line(6,2,12,1,2);dot(17,2,3);break;
 case 'greywings':case 'slickgrey':case 'partedgrey':case 'sweptgrey':case 'silverpart':
  poly([[5,5],[7,1],[13,0],[18,2],[20,5],[17,5],[13,3],[9,4],[7,7],[5,9]],1);line(7,3,12,2,2);rect(5,7,2,4,1);if(s.hair==='sweptgrey'){rect(4,3,3,4,1);line(10,1,16,1,3);}break;
 default:
  poly([[4,5],[7,1],[13,0],[19,2],[20,5],[17,6],[13,3],[8,5],[6,8],[4,9]],1);
  if(s.hair==='messy'||s.hair==='wavy'){dot(5,0,1);rect(1,3,4,3,1);rect(16,0,4,2,1);}break;
 }
 // Eyes and eyebrows carry expression even at one LCD pixel per eye.
 const eyeY=9,farY=s.eyes==='offset'?8:9;
 line(8,eyeY-2,11,eyeY-(s.brow==='angry'?1:2),2);line(15,farY-2,18,farY-(s.brow==='arch'?3:2),2);
 dot(10,eyeY,2);dot(16,farY,2);if(s.brow==='heavy'){line(8,5,11,5,2);line(15,5,18,5,2);}
 if(s.glasses){rect(7,6,6,5,2);rect(8,7,4,3,3);dot(10,8,2);rect(14,6,6,5,2);rect(15,7,4,3,3);dot(16,8,2);line(12,7,14,7,2);}
 if(s.beard){
  poly([[6,10],[8,12],[11,11],[14,12],[18,10],[18,14],[15,16],[10,16],[7,14]],s.beard==='salt'||s.hair==='bandana'?2:1);line(11,13,16,13,3);
  if(s.beard==='salt'){dot(8,13,3);dot(15,15,3);}if(s.beard==='full')rect(11,15,5,2,2);
 }else if(s.moustache){
  rect(9,11,11,2,2);rect(11,10,6,2,2);
  if(id===14)rect(10,11,9,1,1);
  line(11,13,18,13,3);line(12,15,16,15,2);
 }
 else if(s.smile){rect(11,12,7,2,2);line(12,12,16,12,3);}
 else line(12,13,16,13,2);
 if(s.jewel){dot(6,12,1);dot(19,12,1);}

 // Distinct jacket/dress shapes; the middle eight pixels have a shirt palette.
 const left=Math.round((24-s.width)/2),right=left+s.width-1;
 poly([[8,16],[16,16],[right,20],[right,32],[left,32],[left,20]],2);
 poly([[8,17],[16,17],[right-1,20],[right-1,31],[left+1,31],[left+1,20]],1);
 poly([[9,17],[15,17],[15,29],[10,29]],3);
 line(8,18,11,24,1);line(16,18,14,24,1);
 if(['suit','loosetie','sash'].includes(s.wear)){rect(12,21,2,8,2);dot(11,20,2);dot(14,20,2);if(s.wear==='loosetie')line(13,27,15,30,2);}
 if(s.wear==='open'||s.wear==='rolled'){rect(11,18,3,5,3);line(12,21,13,23,2);}
 if(s.wear==='leather'){rect(8,19,8,10,1);line(9,17,11,22,2);line(16,17,14,23,2);dot(8,24,3);}
 if(s.wear==='sash'){for(let n=0;n<11;n++){dot(7+n,19+n,3);dot(8+n,19+n,3);}line(9,21,14,26,2);}
 if(s.wear==='sport'){rect(6,23,13,2,3);rect(11,18,2,12,3);}
 if(s.wear==='uniform'){rect(5,23,5,4,2);rect(15,23,5,4,2);rect(5,24,4,2,1);rect(16,24,3,2,1);rect(3,31,18,3,2);rect(11,31,3,2,3);}
 if(s.wear==='tunic'){oval(12,28,10,8,2);oval(12,27,9,7,1);rect(8,20,8,7,3);for(let x=8;x<17;x+=2)dot(x,23,2);}
 if(s.wear==='blazer'&&s.jewel){for(let x=9;x<16;x+=2)dot(x,21,2);}
 if(id===20){rect(2,14,3,11,2);rect(20,14,2,10,2);rect(2,14,3,2,1);}
 const dress=['dress','blazer','tunic'].includes(s.wear);
 if(dress){poly([[6,28],[18,28],[21,37],[3,37]],2);poly([[7,28],[17,28],[19,35],[5,35]],1);rect(8,37,3,7,3);rect(14,37,3,7,3);}
 else{rect(left+1,31,s.width-2,4,2);rect(7,34,4,bottom-35,2);rect(14,34,4,bottom-35,2);line(8,35,8,bottom-3,1);line(15,35,15,bottom-3,1);}
 // Weight transfer and kick use shaped limbs rather than rectangular sticks.
 if(frame===1){rect(6,35,13,12,0);poly([[8,33],[12,34],[7,44],[3,44]],2);poly([[13,33],[17,34],[21,44],[17,45]],2);rect(2,44,6,2,2);rect(17,45,6,2,2);}
 else if(frame===3){rect(13,33,10,14,0);poly([[12,33],[15,29],[21,27],[23,30],[17,35]],1);line(15,32,21,29,2);rect(20,26,4,5,2);rect(6,44,7,3,2);}
 else{rect(6,bottom-2,6,2,2);rect(14,bottom-2,7,2,2);}
 if(frame===2){poly([[17,20],[21,19],[23,21],[23,24],[18,24]],1);rect(21,20,3,5,3);line(21,20,23,20,2);poly([[5,20],[7,23],[5,31],[2,29]],1);rect(2,29,4,4,3);}
 else if(frame===4){poly([[4,20],[7,20],[17,15],[20,18],[8,26]],1);rect(16,14,5,6,3);line(17,15,20,15,2);rect(18,23,4,7,1);}
 else if(frame===5){poly([[5,20],[1,15],[0,18],[3,25]],1);rect(0,13,4,5,3);poly([[18,21],[22,15],[23,18],[21,26]],1);rect(20,13,4,5,3);}
 else{poly([[left,20],[left+3,21],[left+2,30],[left-1,31]],1);rect(left-1,29,4,4,3);poly([[right-2,20],[right+2,23],[right,27],[right-3,25]],1);rect(right-1,23,4,5,3);line(right,23,right+2,23,2);}
 if((frame===0||frame===1)&&s.prop){
  if(s.prop==='book'||s.prop==='bond'||s.prop==='sign'){rect(0,25,7,10,2);rect(1,26,5,8,3);line(2,28,5,28,1);line(2,31,5,31,1);}
  else if(s.prop==='brick'){rect(0,29,8,5,2);rect(1,29,6,4,1);line(1,31,7,31,2);dot(4,30,2);}
  else if(s.prop==='mate'){oval(3,29,3,4,2);oval(3,28,2,3,1);line(4,24,6,20,3);}
  else if(s.prop==='baton'){rect(1,23,2,16,2);rect(0,27,5,2,2);}
  else if(s.prop==='case'){rect(0,30,8,8,2);rect(1,31,6,6,1);line(2,29,5,29,3);}
  else if(s.prop==='glove'){oval(3,29,3,4,1);line(1,27,5,27,2);}
 }
 if(crouch){
  // The renderer lowers this pose seven pixels, keeping the head in its palette row.
  for(let y=32;y<48;y++)p[y].fill(0);
  poly([[6,32],[11,32],[10,38],[3,38]],2);poly([[13,32],[19,32],[22,38],[15,38]],2);
  rect(3,38,7,2,2);rect(16,38,7,2,2);
 }
 return p;
}
