/* Original 160x144 pixel art for Rosca Kombat.
 * Every region follows the 8x8 CGB palette grid. Slots 0 and 5 belong to
 * the HUD; the stage uses the remaining six palettes. No canvas dependency.
 */
const UI = ['#101838', '#4a5284', '#cd8c39', '#ffe6a5'];
const LIFE = ['#101838', '#48683d', '#82b94c', '#d4e589'];
const NIGHT = '#17243c';

const FONT = {
 A:['010','101','111','101','101'], B:['110','101','110','101','110'],
 C:['011','100','100','100','011'], D:['110','101','101','101','110'],
 E:['111','100','110','100','111'], F:['111','100','110','100','100'],
 G:['011','100','101','101','011'], H:['101','101','111','101','101'],
 I:['111','010','010','010','111'], J:['001','001','001','101','010'],
 K:['101','101','110','101','101'], L:['100','100','100','100','111'],
 M:['101','111','111','101','101'], N:['101','111','111','111','101'],
 O:['010','101','101','101','010'], P:['110','101','110','100','100'],
 Q:['010','101','101','111','011'], R:['110','101','110','101','101'],
 S:['011','100','010','001','110'], T:['111','010','010','010','010'],
 U:['101','101','101','101','111'], V:['101','101','101','101','010'],
 X:['101','101','010','101','101'], Y:['101','101','010','010','010'],
 Z:['111','001','010','100','111'], '9':['111','101','111','001','111'],
 '0':['111','101','101','101','111'], '?':['110','001','010','000','010'],
 '$':['011','110','010','011','110'], '!':['010','010','010','000','010'],
 ' ':['000','000','000','000','000']
};

function scene(name, groups) {
 const pixels=Array.from({length:144},()=>Array(160).fill(0));
 const attributes=Array(360).fill(0);
 const palettes=[UI,...groups.slice(0,4),LIFE,...groups.slice(4)].flat();
 const dot=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&x<160&&y>=40&&y<128)pixels[y][x]=c;};
 const rect=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)dot(x+i,y+j,c);};
 const line=(x,y,X,Y,c)=>{
  x=Math.round(x);y=Math.round(y);X=Math.round(X);Y=Math.round(Y);
  let dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,e=dx+dy;
  for(;;){dot(x,y,c);if(x===X&&y===Y)break;const ee=e*2;if(ee>=dy){e+=dy;x+=sx;}if(ee<=dx){e+=dx;y+=sy;}}
 };
 const oval=(x,y,rx,ry,c)=>{for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if(i*i*ry*ry+j*j*rx*rx<=rx*rx*ry*ry)dot(x+i,y+j,c);};
 const poly=(points,c)=>{
  const min=Math.min(...points.map(p=>p[1])), max=Math.max(...points.map(p=>p[1]));
  for(let y=min;y<=max;y++){
   const xs=[];
   for(let n=0;n<points.length;n++){
    const a=points[n],b=points[(n+1)%points.length];
    if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }
   xs.sort((a,b)=>a-b);for(let n=0;n<xs.length;n+=2)line(Math.ceil(xs[n]),y,Math.floor(xs[n+1]),y,c);
  }
 };
 const pal=(x,y,w,h,n)=>{for(let j=Math.floor(y/8);j<Math.ceil((y+h)/8);j++)for(let i=Math.floor(x/8);i<Math.ceil((x+w)/8);i++)if(j>=5&&j<16&&i>=0&&i<20)attributes[j*20+i]=n;};
 const text=(s,x,y,c)=>{for(const ch of s){const g=FONT[ch]||FONT['?'];g.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')dot(x+i,y+j,c);}));x+=4;}};
 pal(0,40,160,88,1);
 return {pixels,attributes,palettes,name,dot,rect,line,oval,poly,pal,text};
}

function flag(s,x,y) {
 s.pal(x,y,16,24,6);
 s.line(x+2,y,x+2,y+23,3);
 s.rect(x+3,y+1,12,3,1);s.rect(x+3,y+4,12,3,3);s.rect(x+3,y+7,12,3,1);
 s.dot(x+8,y+5,2);s.dot(x+9,y+5,2);
 s.line(x,y+23,x+5,y+23,2);
}

function lamp(s,x,y) {
 // Eight-pixel-wide cast-iron farol, warm glass above a quiet silhouette.
 s.pal(x,y,8,32,4);
 s.line(x+3,y+9,x+3,y+29,1);s.line(x+4,y+9,x+4,y+29,0);
 s.rect(x+1,y+28,6,3,1);s.rect(x,y+30,8,2,0);
 s.rect(x+1,y+2,6,8,1);s.rect(x+2,y+3,4,5,3);s.line(x+3,y+3,x+3,y+7,2);
 s.line(x,y+2,x+7,y+2,0);s.dot(x+3,y,2);s.line(x,y+10,x+7,y+10,0);
}

function pavement(s,top=112) {
 s.pal(0,top,160,128-top,7);s.rect(0,top,160,128-top,1);
 s.line(0,top,159,top,3);s.line(0,top+2,159,top+2,0);
 // Broad slabs and sparse chips keep the fighting plane readable.
 s.line(0,120,159,120,2);
 for(let x=0;x<160;x+=32){s.line(x+8,top+3,x,119,0);s.line(x+24,121,x+20,127,0);}
 for(let x=8;x<160;x+=32){s.line(x,126,x+3,126,2);s.dot(x+18,117,2);}
}

function congress() {
 const s=scene('CONGRESO',[
  [NIGHT,'#2c3d5a','#58617b','#9aa6b6'],
  [NIGHT,'#5b6a77','#9ca79e','#e2ddbd'],
  [NIGHT,'#295851','#549583','#b2c9a0'],
  [NIGHT,'#263844','#b38b50','#ffe0a0'],
  [NIGHT,'#67a6c5','#d6ad55','#e5e3d0'],
  [NIGHT,'#455568','#7d8792','#bec1b2']
 ]);
 const {rect,line,oval,poly,pal,dot}=s;
 // Evening clouds are arranged in repeating horizontal strips.
 for(const [x,y,w] of [[0,46,28],[16,48,31],[112,45,32],[136,47,24]]){line(x,y,x+w,y,1);line(x+5,y+1,x+w-6,y+1,1);}
 // Long symmetrical facade, shadowed windows, projecting stone courses.
 pal(8,64,144,48,2);rect(8,73,144,31,1);
 rect(8,70,144,3,2);line(8,70,151,70,3);line(8,73,151,73,0);
 for(const x of [8,120]){rect(x,65,32,5,1);line(x,65,x+31,65,3);for(let xx=x+2;xx<x+30;xx+=5)rect(xx,67,2,3,2);}
 for(let x=12;x<151;x+=8){rect(x,76,4,4,0);line(x,76,x+3,76,2);}
 // Portico and eight columns read as the Congreso even at cartridge scale.
 poly([[49,76],[80,65],[111,76]],2);line(49,76,80,65,3);line(80,65,111,76,3);
 line(50,77,110,77,3);line(52,79,108,79,0);
 for(const x of [17,29,41,57,97,113,125,137]){
  rect(x,83,6,20,2);rect(x,84,2,18,3);line(x+4,84,x+4,101,1);
  rect(x-1,81,8,2,3);rect(x-1,102,8,2,3);
 }
 rect(69,81,22,23,0);rect(71,83,18,19,1);rect(73,88,14,16,0);
 line(79,89,79,103,2);line(74,88,85,88,2);dot(77,96,3);dot(82,96,3);
 // Copper dome with lantern, ribs and the little crown of the roof.
 pal(56,40,48,32,3);
 oval(80,63,19,17,1);oval(80,63,16,16,2);
 for(const x of [66,73,80,87,94]){const yy=x===80?47:x===73||x===87?49:54;line(80,46,x,63,3);line(x,yy,x,63,1);}
 rect(60,63,41,4,2);line(60,63,100,63,3);line(61,67,99,67,0);
 for(let x=65;x<98;x+=5){rect(x,68,2,3,3);}
 rect(76,44,9,4,2);line(76,44,84,44,3);rect(78,40,5,4,3);dot(80,40,2);
 // Parliament steps, balustrade and lamps frame the playable space.
 for(let y=105;y<112;y+=2){line(8-(y-105),y,151+(y-105),y,y===105?3:2);}
 lamp(s,0,80);lamp(s,152,80);flag(s,120,40);
 pavement(s);
 return s;
}

function rosada() {
 const s=scene('CASA ROSADA',[
  [NIGHT,'#33435b','#776276','#c29a99'],
  [NIGHT,'#8d5863','#c78888','#efb6a3'],
  [NIGHT,'#674c60','#a0717a','#d6a18e'],
  [NIGHT,'#334044','#c39c67','#ffe3a3'],
  [NIGHT,'#7bb4cf','#d4a64b','#eee0c8'],
  [NIGHT,'#47535f','#77877c','#adb29c']
 ]);
 const {rect,line,oval,poly,pal,dot,text}=s;
 // Palace silhouette: centre rises above two arcaded wings.
 pal(0,48,160,64,2);rect(0,60,160,44,1);
 rect(8,56,56,5,2);rect(96,56,56,5,2);
 rect(64,48,32,56,2);rect(60,56,40,5,2);
 line(64,48,95,48,3);line(8,56,63,56,3);line(96,56,151,56,3);
 for(let x=4;x<160;x+=8){rect(x,58,3,2,3);}
 // Pink quoins and deep, regular windows; the shared modules tile cleanly.
 for(let x=4;x<160;x+=16){
  rect(x,64,9,10,0);rect(x+1,65,7,8,1);line(x,63,x+8,63,3);
  line(x+4,65,x+4,72,2);line(x+1,69,x+7,69,2);
  rect(x-1,74,11,2,3);
 }
 line(0,77,159,77,3);line(0,79,159,79,0);
 for(let x=0;x<160;x+=16){
  // A dark semicircle over each doorway makes the arcade unmistakable.
  oval(x+8,87,5,6,0);rect(x+3,87,11,17,0);
  line(x+2,88,x+2,103,3);line(x+14,88,x+14,103,2);
  rect(x,101,3,3,3);rect(x+14,101,2,3,2);
  line(x+4,89,x+11,89,1);rect(x+5,91,6,11,1);
 }
 // Presidential balcony and national shield occupy the visual centre.
 pal(64,56,32,24,3);rect(66,57,28,18,1);rect(70,58,20,14,0);
 oval(80,61,3,4,3);rect(68,68,24,3,2);line(68,68,91,68,3);
 for(let x=69;x<92;x+=4)line(x,71,x,76,3);
 line(67,77,92,77,2);rect(76,70,8,6,3);line(76,70,83,70,2);line(76,75,83,75,2);
 // The plaza has trees, a small pyramid and tiled paths, not a crowd wall.
 pal(0,88,16,24,7);pal(144,88,16,24,7);
 for(const x of [6,153]){rect(x,99,2,12,0);oval(x+1,94,7,5,2);oval(x-2,92,5,4,1);line(x+1,98,x+1,101,3);}
 rect(16,105,128,7,1);line(16,106,143,106,3);line(16,109,143,109,2);
 flag(s,104,40);
 // A tiny satirical plaque sits in the facade's corner.
 pal(120,96,24,8,4);rect(121,97,22,7,1);text('VOLVE',122,98,3);
 pavement(s);
 // Plaza de Mayo paving pattern, kept to the lower edge.
 for(let x=0;x<160;x+=16){line(x,124,x+7,124,2);line(x+8,127,x+15,127,2);}
 return s;
}

function obelisk() {
 const s=scene('9 DE JULIO',[
  [NIGHT,'#293452','#505a78','#9d9bb6'],
  [NIGHT,'#465471','#768092','#c2c5c2'],
  [NIGHT,'#7a8190','#b7b6ae','#eee2b6'],
  [NIGHT,'#6d3560','#c36c8c','#ffd0a5'],
  [NIGHT,'#65a6c8','#caa653','#f1e5b7'],
  [NIGHT,'#38475a','#677684','#a6aaa0']
 ]);
 const {rect,line,poly,pal,dot,text}=s;
 // Layered Avenida 9 de Julio skyline. The unlit walls form a calm backdrop.
 pal(0,48,64,56,2);pal(96,48,64,56,2);
 const blocks=[[0,57,16,46],[16,49,16,54],[32,64,16,39],[48,72,16,31],[96,73,16,30],[112,61,16,42],[128,50,16,53],[144,58,16,45]];
 for(const [x,y,w,h] of blocks){
  rect(x,y,w,h,1);line(x,y,x+w-1,y,2);line(x+w-1,y,x+w-1,103,0);
  for(let yy=y+5;yy<99;yy+=8)for(let xx=x+3;xx<x+w-2;xx+=6){rect(xx,yy,2,3,2);if((xx+yy)%3===0)dot(xx,yy,3);}
 }
 // Roof aerials and water tanks lend the skyline a Buenos Aires rhythm.
 line(5,52,5,57,2);line(1,54,10,54,2);rect(134,46,5,4,1);line(136,43,136,46,2);
 pal(0,64,24,16,4);rect(1,65,22,13,0);line(2,66,21,66,2);line(2,76,21,76,2);text('SUBE',4,69,3);
 pal(136,64,24,16,4);rect(137,65,22,13,0);text('DOLAR',138,67,2);text('$999',140,73,3);
 // Central pale obelisk: sloped top, one lit face, one shadow face.
 pal(64,40,32,64,3);
 poly([[80,41],[87,57],[87,100],[72,100],[72,57]],2);
 poly([[80,41],[80,99],[73,99],[73,57]],3);
 line(80,43,86,57,1);line(86,58,86,99,1);line(73,58,73,98,3);
 rect(78,90,3,8,0);line(77,89,81,89,1);
 line(72,68,86,68,1);line(73,69,79,69,2);line(73,81,79,81,2);
 rect(68,100,23,3,2);line(68,100,90,100,3);
 // Avenue perspective converges behind the monument.
 pal(0,104,160,24,7);rect(0,104,160,24,1);
 line(0,105,159,105,2);poly([[61,105],[98,105],[133,127],[25,127]],0);
 line(61,105,25,127,2);line(98,105,133,127,2);
 for(const [y,w] of [[109,2],[115,3],[124,4]])rect(79,y,w,2,3);
 // A little colectivo with cream roof, red band and glowing destination.
 pal(8,88,40,24,6);rect(9,93,36,15,1);rect(12,90,30,4,3);rect(10,96,34,5,0);
 for(let x=12;x<43;x+=7){rect(x,96,5,4,1);line(x,96,x+4,96,3);}
 rect(10,102,34,3,2);rect(10,105,34,3,3);rect(36,95,6,2,3);
 rect(13,107,7,4,0);rect(34,107,7,4,0);dot(16,109,2);dot(37,109,2);dot(10,103,3);dot(43,103,3);
 // Low rail and curb bracket the ring while leaving fighters unobscured.
 pal(0,112,160,16,7);line(0,112,159,112,3);line(0,114,159,114,0);
 for(let x=0;x<160;x+=16){line(x,120,x+7,120,2);line(x+8,127,x+15,127,2);}
 return s;
}

function construction() {
 const s=scene('OBRA EN POZO',[
  [NIGHT,'#2f3d53','#666c75','#aba790'],
  [NIGHT,'#755747','#ad7850','#d6ac70'],
  [NIGHT,'#6d683a','#b4a255','#f4d37a'],
  [NIGHT,'#353e43','#b58143','#ffe09a'],
  [NIGHT,'#70a7bf','#d09d4c','#e9dfbb'],
  [NIGHT,'#4d5053','#818078','#b2a58b']
 ]);
 const {rect,line,oval,poly,pal,dot,text}=s;
 // Distant unfinished shells repeat the same exposed-beam module.
 pal(0,64,160,48,2);
 for(let x=0;x<160;x+=32){
  rect(x,72,27,31,1);rect(x+3,76,21,27,0);
  for(let y=76;y<104;y+=12){rect(x,y,28,3,2);line(x,y,x+27,y,3);}
  rect(x,72,3,32,2);rect(x+25,72,3,32,1);
  line(x+9,69,x+9,73,1);line(x+17,70,x+17,73,1);
 }
 // Yellow tower crane, braced boom and suspended hook against the sky.
 pal(8,40,136,24,3);pal(24,64,16,40,3);
 rect(25,44,13,59,1);line(25,44,25,103,3);line(37,44,37,103,2);
 for(let y=47;y<101;y+=12){line(26,y,36,y+10,2);line(36,y,26,y+10,2);line(26,y+10,36,y+10,3);}
 rect(10,48,132,8,1);line(10,48,141,48,3);line(10,55,141,55,2);
 for(let x=11;x<139;x+=12){line(x,49,x+10,54,2);line(x+10,49,x,54,2);}
 line(31,41,11,48,3);line(31,41,100,48,2);
 rect(17,56,9,7,2);rect(18,57,6,4,0);line(17,62,25,62,3);
 // The cable is dark on bright steel and bright on the empty sky.
 line(121,56,121,71,3);pal(120,64,8,16,3);line(121,64,121,74,3);line(121,74,124,77,2);line(124,77,126,74,2);
 // Stacks of clay bricks, reinforcing steel and timber.
 for(const [x,y,w,h] of [[0,97,24,15],[112,96,48,16]]){
  pal(x,y,w,h,2);rect(x,y,w,h,2);
  for(let yy=y;yy<y+h;yy+=4){line(x,yy,x+w-1,yy,1);for(let xx=x+((yy-y)%8?4:0);xx<x+w;xx+=8)line(xx,yy,xx,yy+3,1);}
  line(x,y,x+w-1,y,3);
 }
 // A readable pair of absurd construction notices.
 pal(48,64,48,16,4);rect(49,65,46,13,0);rect(50,66,44,11,2);
 text('OBRA ETERNA',51,67,0);line(52,74,91,74,1);
 pal(104,80,40,16,4);rect(105,81,38,13,2);rect(106,82,36,11,3);
 text('INAUGURA',108,83,0);text('MANANA',112,89,0);
 // Road barrier, striped hazard edge and a deep empty excavation.
 pal(0,112,160,16,7);rect(0,112,160,16,1);line(0,112,159,112,3);
 rect(40,116,80,11,0);line(39,115,121,115,3);line(40,117,119,117,2);
 for(let x=43;x<118;x+=12){line(x,118,x+5,118,1);dot(x+4,122,1);}
 pal(40,104,80,8,3);rect(40,105,80,6,2);
 for(let x=40;x<120;x+=8)poly([[x,105],[x+4,105],[x+1,110],[x-3,110]],0);
 line(40,104,119,104,3);line(40,111,119,111,0);
 // Cones and rusty pipes mark the edge of the fighting platform.
 pal(24,104,16,8,2);pal(120,104,16,8,2);
 for(const x of [29,125]){poly([[x+2,104],[x+5,110],[x-1,110]],3);line(x,108,x+3,108,1);rect(x-2,111,9,1,0);}
 for(let x=0;x<24;x+=8){line(x,122,x+6,122,2);line(x+2,124,x+7,124,0);}
 return s;
}

export function stageArt(index) {
 const s=[congress,rosada,obelisk,construction][index]?.();
 if(!s)throw new RangeError(`Unknown stage ${index}`);
 return {pixels:s.pixels,attributes:s.attributes,palettes:s.palettes,name:s.name};
}
