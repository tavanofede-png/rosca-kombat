#include <gb/gb.h>
#include <gb/cgb.h>
#include <gb/metasprites.h>
#include <gbdk/console.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "roster.h"
#include "art.h"

#define TITLE 0
#define PICK 1
#define RIVAL 2
#define SETUP 3
#define INTRO 4
#define FIGHT 5
#define ROUND_END 6
#define DIZZY 7
#define FINISHER 8
#define RESULT 9
#define PAUSE 10
#define HELP 11
#define IDLE 0
#define PUNCH 1
#define KICK 2
#define SPECIAL 3
#define HURT 4
#define GUARD 5
#define PX(n) ((int16_t)(n)*16)

// Q4 positions, signed jump velocity; all combat is simulated in the ROM.
typedef struct {
 int16_t x,y,vy;
 uint8_t hp,meter,action,ticks,pose,face,cooldown,invuln,blocking,hit;
} Fighter;
typedef struct {int16_t x,y;int8_t vx,vy;uint8_t active,life,damage,kind,super;} Shot;
Fighter fighters[2];
Shot shots[2];
uint8_t state,previous,keys,pressed,repeat_delay,menu_index,hero,rival=5;
uint8_t difficulty=1,arena,game_mode,ladder,round_no=1,wins[2],seconds_left,subsecond;
uint8_t saved_state,winner,loser,shake,flash,message_ticks,ai_wait,ai_attack;
uint8_t music_on=1,music_tick,music_note,combo,combo_timer,finisher_done;
uint8_t hit_count,block_count,special_count,jump_count,super_count,round_count;
uint16_t frame,state_timer,random_state=0x2a61;
uint8_t attrs[360];
const uint8_t tour_order[]={5,6,7,2,1,0,4,31};
const char * const level_names[]={"TRANQUI","PICANTE","IMPOSIBLE"};
const char * const arena_names[]={"CONGRESO","CASA ROSADA","OBELISCO","OBRA EN POZO"};
const char * const mode_names[]={"DUELO LIBRE","TORNEO DE ROSCA"};
const palette_color_t ui_pal[]={RGB(2,3,7),RGB(9,10,16),RGB(25,17,7),RGB(31,28,20)};
const palette_color_t health_pal[]={RGB(2,3,7),RGB(11,28,15),RGB(4,10,10),RGB(29,31,21)};
const uint8_t bar_tiles[]={
 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
 0,0,126,0,126,0,126,0,126,0,126,0,126,0,0,0,
 0,0,126,0,66,0,66,0,66,0,66,0,126,0,0,0
};
const uint16_t notes[]={1315,1395,1480,1560,1480,1395,1240,1395,1315,1395,1480,1645,1560,1480,1395,1240};

uint8_t rng(void){random_state^=random_state<<7;random_state^=random_state>>9;random_state^=random_state<<8;return (uint8_t)random_state;}
int16_t absolute(int16_t n){return n<0?-n:n;}
int16_t distance(void){return absolute(fighters[0].x-fighters[1].x);}
void label(uint8_t x,uint8_t y,const char *s){gotoxy(x,y);while(*s&&x++<(y==17?19:20))putchar(*s++);}
void short_label(uint8_t x,uint8_t y,const char *s,uint8_t n){gotoxy(x,y);while(*s&&n--)putchar(*s++);}
void number3(uint8_t x,uint8_t y,uint8_t n){gotoxy(x,y);putchar('0'+n/100);putchar('0'+n/10%10);putchar('0'+n%10);}
void line_clear(uint8_t y){uint8_t i;gotoxy(0,y);for(i=0;i<19;i++)putchar(' ');}
void hide_all(void){uint8_t i;for(i=0;i<40;i++)move_sprite(i,0,0);}
void sfx(uint8_t k){
 if(k==0){NR10_REG=0;NR11_REG=0x80;NR12_REG=0x83;NR13_REG=0xb0;NR14_REG=0x87;}
 else if(k==3){NR10_REG=0x26;NR11_REG=0x40;NR12_REG=0xc3;NR13_REG=0x30;NR14_REG=0x86;}
 else{NR41_REG=0x10;NR42_REG=k==2?0xf2:0x93;NR43_REG=k==2?0x35:0x14;NR44_REG=0xc0;}
}
void music(void){uint16_t n;if(!music_on||state==PAUSE)return;if(++music_tick<12)return;music_tick=0;n=notes[music_note++&15];NR21_REG=0x80;NR22_REG=0x52;NR23_REG=(uint8_t)n;NR24_REG=0x80|(uint8_t)(n>>8);}
void clear_screen(void){
 uint16_t i;DISPLAY_OFF;hide_all();cls();for(i=0;i<360;i++)attrs[i]=0;
 VBK_REG=1;set_bkg_tiles(0,0,20,18,attrs);VBK_REG=0;move_bkg(0,0);set_bkg_palette(0,1,ui_pal);
 SHOW_BKG;SHOW_SPRITES;DISPLAY_ON;
}
void palette_for(uint8_t slot,uint8_t id){
 set_sprite_palette(slot<2?slot*3:slot+4,slot<2?3:1,character_palettes[id]+(slot<2?0:8));
}
void load_fighter(uint8_t slot,uint8_t id){
 SWITCH_ROM(2+(id>>2));VBK_REG=1;set_sprite_data(slot?88:0,88,fighter_art[id]);VBK_REG=0;SWITCH_ROM(11);palette_for(slot,id);
}
void draw_person(uint8_t slot,uint8_t pose,int16_t x,int16_t y,uint8_t flip){
 if(flip)move_metasprite_flipx(fighter_poses[slot][pose],slot?88:0,8,slot*14,(uint8_t)(x+32),(uint8_t)(y+16));
 else move_metasprite_ex(fighter_poses[slot][pose],slot?88:0,8,slot*14,(uint8_t)(x+8),(uint8_t)(y+16));
}
void title_screen(void){
 clear_screen();label(2,1,"REPUBLICA ARCADE");label(4,4,"R O S C A");label(3,6,"K O M B A T");
 label(1,8,"32 EGOS / 1 SILLA");label(5,12,"A: JUGAR");label(5,14,"SEL: GUIA");label(2,17,"SATIRA ARGENTINA");
 load_fighter(0,0);load_fighter(1,1);draw_person(0,2,4,88,0);draw_person(1,2,132,88,1);
}
void help_screen(void){
 clear_screen();label(3,1,"MANUAL DE ROSCA");
 label(1,3,"CRUCETA: CAMINAR");label(1,4,"ARRIBA: SALTAR");label(1,5,"ABAJO: BLOQUEAR");
 label(1,7,"A: PUNO  B: PATADA");label(1,8,"SELECT / ABAJO+B:");label(2,9,"ESPECIAL (35)");
 label(1,10,"A+B: SUPER (100)");label(1,12,"START: PAUSAR");label(1,13,"REMATE: A+B / SEL");
 label(1,15,"CARGA PODER PEGANDO");label(2,16,"B / A: VOLVER");
}
void picker(void){
 uint8_t i,start=(menu_index/4)*4,tiles[80];clear_screen();label(1,0,state==PICK?"ELEGI TU CANDIDATO":"ELEGI TU RIVAL");
 for(i=0;i<4;i++){gotoxy(0,3+i*2);putchar(start+i==menu_index?'>':' ');short_label(1,3+i*2,roster[start+i].name,10);}
 SWITCH_ROM(2+(menu_index>>2));set_bkg_data(128,80,portrait_art[menu_index]);
 set_bkg_palette(1,7,(const palette_color_t *)(portrait_art[menu_index]+1360));
 VBK_REG=1;set_bkg_tiles(12,2,8,10,portrait_art[menu_index]+1280);VBK_REG=0;SWITCH_ROM(11);
 for(i=0;i<80;i++)tiles[i]=128+i;set_bkg_tiles(12,2,8,10,tiles);
 label(0,12,roster[menu_index].name);
 label(0,13,roster[menu_index].special);label(0,15,"ARR/ABA: PERSONAJE");label(0,16,"IZQ/DER: PAGINA");label(0,17,"A: OK  B: VOLVER");
 gotoxy(1,1);printf("%u/32",(unsigned int)(menu_index+1));
}
void setup_screen(void){
 clear_screen();label(1,1,roster[hero].name);label(8,3,"VS");label(1,5,roster[rival].name);
 label(1,7,"IZQ/DER: DIFICULTAD");label(3,8,level_names[difficulty]);
 label(1,10,"ARR/ABA: ESCENARIO");label(3,11,arena_names[arena]);
 label(1,13,"SELECT: MODO");label(2,14,mode_names[game_mode]);label(1,16,"A: PELEAR B: ATRAS");
}
void hud(void){
 uint8_t i,t,bar[8];line_clear(0);short_label(0,0,roster[hero].name,7);short_label(13,0,roster[rival].name,7);
 gotoxy(9,0);putchar('0'+seconds_left/10);putchar('0'+seconds_left%10);
 for(i=0;i<8;i++)bar[i]=i<(fighters[0].hp+12)/13?121:122;set_bkg_tiles(0,1,8,1,bar);
 for(i=0;i<8;i++)bar[i]=7-i<(fighters[1].hp+12)/13?121:122;set_bkg_tiles(12,1,8,1,bar);
 gotoxy(0,2);printf("%u",(unsigned int)wins[0]);gotoxy(17,2);printf("%u",(unsigned int)wins[1]);
 number3(0,16,fighters[0].meter);number3(15,16,fighters[1].meter);
 t=round_no;gotoxy(7,2);printf("R%u",(unsigned int)t);
}
void announcement(const char *s){line_clear(4);label(0,4,s);message_ticks=90;}
void arena_screen(void){
 uint16_t icon0=roster[hero].icon*96,icon1=roster[rival].icon*96;uint8_t green[8]={5,5,5,5,5,5,5,5};
 DISPLAY_OFF;hide_all();cls();SWITCH_ROM(10);set_bkg_data(128,stage_counts[arena],stage_art[arena]);
 set_bkg_tiles(0,0,20,18,stage_maps[arena]);VBK_REG=1;set_bkg_tiles(0,0,20,18,stage_attrs[arena]);VBK_REG=0;set_bkg_palette(0,8,stage_palettes[arena]);SWITCH_ROM(11);
 set_bkg_palette(5,1,health_pal);set_bkg_data(120,3,bar_tiles);
 VBK_REG=1;set_bkg_tiles(0,1,8,1,green);set_bkg_tiles(12,1,8,1,green);VBK_REG=0;load_fighter(0,hero);load_fighter(1,rival);
 SWITCH_ROM(10);VBK_REG=1;set_sprite_data(216,6,icons+icon0);set_sprite_data(222,6,icons+icon1);VBK_REG=0;SWITCH_ROM(11);
 palette_for(2,hero);palette_for(3,rival);move_bkg(0,0);DISPLAY_ON;hud();
}
void reset_round(void){
 uint8_t i;for(i=0;i<2;i++){memset(&fighters[i],0,sizeof(Fighter));fighters[i].x=PX(i?119:17);fighters[i].y=PX(77);fighters[i].hp=100;fighters[i].meter=35;fighters[i].face=i;shots[i].active=0;}
 seconds_left=60;subsecond=0;combo=combo_timer=0;ai_wait=60;ai_attack=0;shake=flash=0;message_ticks=0;
 state=INTRO;state_timer=100;arena_screen();announcement("SE ABRE LA SESION");
}
void start_match(void){wins[0]=wins[1]=0;round_no=1;finisher_done=0;reset_round();}
void add_meter(uint8_t i,uint8_t n){uint16_t v=fighters[i].meter+n;fighters[i].meter=v>100?100:(uint8_t)v;}
void hurt(uint8_t target,uint8_t damage,uint8_t owner,uint8_t heavy){
 Fighter *p=&fighters[target];int16_t push;
 if(p->invuln||!p->hp)return;
 if(p->blocking&&p->y>=PX(77)){
  damage=heavy?3:0;add_meter(target,6);block_count++;sfx(1);p->invuln=9;
 }else{
  p->action=HURT;p->ticks=heavy?24:16;p->invuln=heavy?26:18;shake=heavy?12:5;hit_count++;sfx(heavy?2:1);
  if(owner==0){combo=combo_timer?combo+1:1;combo_timer=65;if(combo>1)announcement("COMBO DE PROMESAS!");}
 }
 p->hp=damage>=p->hp?0:p->hp-damage;push=fighters[owner].x<p->x?PX(heavy?9:4):-PX(heavy?9:4);
 p->x+=push;if(p->x<PX(0))p->x=0;if(p->x>PX(136))p->x=PX(136);add_meter(owner,9);add_meter(target,4);
}
void special(uint8_t i,uint8_t super){
 Fighter *p=&fighters[i];Shot *s=&shots[i];uint8_t id=i?rival:hero,type=roster[id].type,cost=super?100:35;
 if(p->meter<cost||p->cooldown||p->ticks||s->active)return;
 p->meter-=cost;p->action=SPECIAL;p->ticks=super?30:23;p->cooldown=super?65:44;p->hit=0;
 special_count++;if(super)super_count++;sfx(3);announcement(super?roster[id].finish:roster[id].special);
 if(type==3){p->hp+=super?30:13;if(p->hp>100)p->hp=100;}
 s->active=1;s->kind=type;s->super=super;s->damage=roster[id].power+(super?15:3);s->life=type==5?70:90;
 s->x=p->x+PX(p->face?0:20);s->y=p->y+PX(18);s->vx=p->face?-30:30;s->vy=0;
 if(type==1){s->vx=p->face?-22:22;s->damage+=5;s->vy=-5;}
 if(type==2){s->vx=p->face?-43:43;}
 if(type==4){s->x=fighters[1-i].x+PX(5);s->y=PX(28);s->vx=0;s->vy=23;}
 if(type==5){s->vx=p->face?-13:13;s->damage-=3;}
}
void attack(uint8_t i,uint8_t kind){
 Fighter *p=&fighters[i];if(p->ticks||p->cooldown)return;p->action=kind;p->ticks=kind==KICK?23:17;p->hit=0;p->blocking=0;sfx(0);
}
void controls(uint8_t i,uint8_t input,uint8_t tap){
 Fighter *p=&fighters[i];uint8_t id=i?rival:hero;int16_t speed=roster[id].speed;
 p->blocking=0;if(p->action==HURT&&p->ticks)return;
 if((tap&J_SELECT)||((tap&J_B)&&(input&J_DOWN))){special(i,0);return;}
 if((input&(J_A|J_B))==(J_A|J_B)&&(tap&(J_A|J_B))){special(i,1);return;}
 if(p->ticks)return;
 if((input&J_DOWN)&&p->y==PX(77)){p->blocking=1;p->action=GUARD;return;}
 if(tap&J_A){attack(i,PUNCH);return;}if(tap&J_B){attack(i,KICK);return;}
 if((tap&J_UP)&&p->y==PX(77)){p->vy=-57;jump_count++;sfx(0);}
 p->action=IDLE;
 if(input&J_LEFT)p->x-=speed;if(input&J_RIGHT)p->x+=speed;
 if(p->x<0)p->x=0;if(p->x>PX(136))p->x=PX(136);
 p->pose=(input&(J_LEFT|J_RIGHT))&&((frame>>3)&1)?1:0;
}
void ai(void){
 uint8_t input=0,tap=0,v;Fighter *p=&fighters[1],*o=&fighters[0];int16_t d=distance(),dx=o->x-p->x;
 if(ai_wait){ai_wait--;controls(1,0,0);return;}
 if(ai_attack)ai_attack--;
 // CPU sees active attacks only after a difficulty-dependent reaction delay.
 if(difficulty&&d<PX(40)&&o->ticks&&o->action!=HURT&&((frame&7)<(difficulty==2?6:3)))input=J_DOWN;
 else if(d>PX(26+(difficulty==0?3:0)))input=dx<0?J_LEFT:J_RIGHT;
 else if(d<PX(17)&&difficulty==2&&!(rng()&3))input=dx<0?J_RIGHT:J_LEFT;
 if(!ai_attack&&!p->ticks){
  v=rng();ai_attack=difficulty==0?35:difficulty==1?22:13;
  if(p->meter==100&&d<PX(80)&&(v&3)==0)input=tap=J_A|J_B;
  else if(p->meter>=35&&d>PX(30)&&(v&3)==0)tap=J_SELECT;
  else if(d<PX(34))tap=(v&1)?J_A:J_B;
  else if(difficulty&&v<45&&p->y==PX(77))tap=J_UP;
 }
 // Jump over an approaching projectile, with a longer delay on easy.
 if(difficulty&&shots[0].active&&absolute(shots[0].x-p->x)<PX(38)&&!(frame&15))tap|=J_UP;
 controls(1,input|tap,tap);
}
void update_fighter(uint8_t i){
 Fighter *p=&fighters[i],*o=&fighters[1-i];uint8_t id=i?rival:hero,reach;
 if(p->invuln)p->invuln--;if(p->cooldown)p->cooldown--;
 if(p->ticks){p->ticks--;if(!p->ticks){p->action=IDLE;p->cooldown=7;}}
 if(p->y<PX(77)||p->vy){p->y+=p->vy;p->vy+=3;if(p->y>=PX(77)){p->y=PX(77);p->vy=0;}}
 if(!p->ticks)p->face=p->x>o->x;
 if((p->action==PUNCH&&p->ticks==10)||(p->action==KICK&&p->ticks==14)){
  reach=p->action==KICK?37:29;
  if(distance()<PX(reach)&&absolute(p->y-o->y)<PX(25)&&((p->face&&o->x<p->x)||(!p->face&&o->x>p->x))){hurt(1-i,p->action==KICK?11:7,i,0);p->hit=1;}
 }
 if(p->action==HURT)p->pose=5;else if(p->blocking)p->pose=4;else if(p->action==PUNCH||p->action==SPECIAL)p->pose=2;else if(p->action==KICK)p->pose=3;else if(p->y<PX(72))p->pose=1;
 (void)id;
}
void update_shot(uint8_t i){
 Shot *s=&shots[i];Fighter *o=&fighters[1-i];if(!s->active)return;
 s->x+=s->vx;s->y+=s->vy;if(s->kind==1&&s->vy<15)s->vy++;
 if(s->life)s->life--;if(!s->life||s->x<PX(-18)||s->x>PX(164)||s->y>PX(122)){s->active=0;return;}
 if(absolute((s->x+PX(8))-(o->x+PX(12)))<PX(s->kind==5?20:16)&&absolute((s->y+PX(8))-(o->y+PX(24)))<PX(23)){
  hurt(1-i,s->damage,i,1);s->active=0;
 }
}
void render(void){
 uint8_t i,k,compact=shots[0].active&&shots[1].active;int16_t x,y;Shot *s;Fighter *p;
 for(i=0;i<2;i++){
  p=&fighters[i];x=p->x/16;y=p->y/16;if(p->pose==4)y+=7;
 if(state==FINISHER&&i==loser){y-=((state_timer&15)<8?2:0);x+=(state_timer&3)-1;}
  if(p->invuln&&(frame&2)&&state==FIGHT){for(k=i*14;k<i*14+14;k++)move_sprite(k,0,0);}
  else draw_person(i,p->pose,x,y,p->face);
  s=&shots[i];for(k=0;k<2;k++){
   // Two simultaneous shots use compact art: at most 4+4+1+1 sprites per line.
   if(s->active&&(!compact||!k)){set_sprite_tile(28+i*2+k,216+i*6+(compact?4:k*2));set_sprite_prop(28+i*2+k,14+i);move_sprite(28+i*2+k,(uint8_t)(s->x/16+8+(compact?4:k*8)),(uint8_t)(s->y/16+16));}
   else move_sprite(28+i*2+k,0,0);
  }
 }
 if(shake){shake--;move_bkg((shake&1)?1:255,0);}else move_bkg(0,0);
}
void end_round(void){
 winner=fighters[0].hp>fighters[1].hp?0:fighters[1].hp>fighters[0].hp?1:2;
 // A double KO or draw replays the round without awarding a win.
 if(winner==2){state=ROUND_END;state_timer=130;announcement("EMPATE. OTRA SESION");return;}
 loser=1-winner;wins[winner]++;round_count++;hud();shots[0].active=shots[1].active=0;
 if(wins[winner]>=2){
  if(!fighters[loser].hp){state=DIZZY;state_timer=190;announcement(winner==0?"REMATALO! A+B / SEL":"REMATE DE LA CPU!");fighters[loser].pose=5;}
  else{state=ROUND_END;state_timer=130;announcement("GANO POR ENCUESTA");}
 }else{state=ROUND_END;state_timer=130;announcement(winner==0?"GANASTE EL ROUND!":"LA ROSCA CONTRAATACA");}
}
void do_finisher(void){
 finisher_done=1;state=FINISHER;state_timer=180;announcement(roster[winner?rival:hero].finish);sfx(3);
 shots[winner].active=1;shots[winner].x=fighters[loser].x+PX(4);shots[winner].y=PX(36);shots[winner].vx=0;shots[winner].vy=0;shots[winner].life=255;
}
void result_screen(void){
 clear_screen();label(1,1,winner==0?"GANASTE LA ROSCA":"PERDISTE EL QUORUM");label(1,4,roster[winner?rival:hero].name);
 label(1,6,finisher_done?"ROSCALITY!":"SE LEVANTA LA SESION");
 label(1,9,winner==0?"PROMETIO Y PEGO.":"LA ENCUESTA MINTIO.");
 if(game_mode&&winner==0&&ladder<7){label(1,12,"A: SIGUIENTE RIVAL");}
 else if(game_mode&&winner==0){label(1,11,"PRESIDENTE DEL RING");label(1,13,"A: NUEVO TORNEO");}
 else label(1,12,"A: REVANCHA");
 label(1,15,"B: OTRO PERSONAJE");load_fighter(0,winner?rival:hero);draw_person(0,3,136,40,0);
}
void pause_screen(void){
 hide_all();
 line_clear(5);line_clear(6);line_clear(7);line_clear(8);line_clear(9);line_clear(10);
 label(1,5,"CUARTO INTERMEDIO");label(2,7,"START: CONTINUAR");label(2,8,"SELECT: MUSICA");label(2,10,"ABAJO+B: SALIR");
}
void menu_input(void){
 uint8_t tap=pressed,old=menu_index;
 if(keys&(J_UP|J_DOWN|J_LEFT|J_RIGHT)){if(repeat_delay)repeat_delay--;else{tap|=keys&(J_UP|J_DOWN|J_LEFT|J_RIGHT);repeat_delay=12;}}else repeat_delay=0;
 if(state==TITLE){if(tap&(J_A|J_START)){state=PICK;menu_index=hero;picker();sfx(0);}else if(tap&J_SELECT){state=HELP;help_screen();}return;}
 if(state==HELP){if(tap&(J_A|J_B|J_START)){state=TITLE;title_screen();}return;}
 if(state==PICK||state==RIVAL){
  if(tap&J_DOWN)menu_index=(menu_index+1)&31;if(tap&J_UP)menu_index=(menu_index+31)&31;
  if(tap&J_RIGHT)menu_index=(menu_index+4)&31;if(tap&J_LEFT)menu_index=(menu_index+28)&31;
  if(menu_index!=old){picker();sfx(0);}
  if(tap&J_A){if(state==PICK){hero=menu_index;state=RIVAL;menu_index=rival;picker();}else{rival=menu_index;state=SETUP;setup_screen();}sfx(0);}
  else if(tap&J_B){if(state==RIVAL){state=PICK;menu_index=hero;picker();}else{state=TITLE;title_screen();}}return;
 }
 if(state==SETUP){
  if(tap&J_RIGHT)difficulty=(difficulty+1)%3;if(tap&J_LEFT)difficulty=(difficulty+2)%3;
  if(tap&J_UP)arena=(arena+3)&3;if(tap&J_DOWN)arena=(arena+1)&3;if(tap&J_SELECT)game_mode=1-game_mode;
  if(tap&(J_UP|J_DOWN|J_LEFT|J_RIGHT|J_SELECT))setup_screen();
  if(tap&(J_A|J_START)){ladder=0;if(game_mode){rival=tour_order[0];if(rival==hero)rival=29;}start_match();}
  else if(tap&J_B){state=RIVAL;menu_index=rival;picker();}return;
 }
 if(state==RESULT){
  if(tap&J_A){if(game_mode&&winner==0){ladder=ladder<7?ladder+1:0;rival=tour_order[ladder];if(rival==hero)rival=29;arena=ladder&3;}start_match();}
  else if(tap&J_B){state=PICK;menu_index=hero;picker();}
 }
}
void main(void){
 SWITCH_ROM(11);
 SPRITES_8x16;NR52_REG=0x80;NR50_REG=0x77;NR51_REG=0xff;BGP_REG=0xe4;OBP0_REG=0xe4;OBP1_REG=0xe4;
 title_screen();
 while(1){
  wait_vbl_done();frame++;keys=joypad();pressed=keys&~previous;previous=keys;random_state+=DIV_REG;music();
  if(state<=SETUP||state==RESULT||state==HELP){menu_input();continue;}
  if(state==PAUSE){
   if(pressed&J_START){state=saved_state;arena_screen();announcement("SIGUE LA SESION");}
   else if(pressed&J_SELECT){music_on=!music_on;if(!music_on)NR22_REG=0;}
   else if((keys&J_DOWN)&&(pressed&J_B)){state=TITLE;title_screen();}continue;
  }
  if((pressed&J_START)&&(state==FIGHT||state==INTRO)){saved_state=state;state=PAUSE;pause_screen();continue;}
  if(message_ticks){message_ticks--;if(!message_ticks)line_clear(4);}
  if(state==INTRO){if(state_timer)state_timer--;else{state=FIGHT;announcement("A ROSQUEAR!");}}
  else if(state==FIGHT){
   if(combo_timer)combo_timer--;controls(0,keys,pressed);ai();update_fighter(0);update_fighter(1);
   // Prevent fighters walking through each other on the ground; jumping crosses over.
   if(distance()<PX(18)&&absolute(fighters[0].y-fighters[1].y)<PX(20)){
    if(fighters[0].x<fighters[1].x){fighters[0].x-=6;fighters[1].x+=6;}else{fighters[0].x+=6;fighters[1].x-=6;}
    if(fighters[0].x<0)fighters[0].x=0;if(fighters[1].x<0)fighters[1].x=0;
    if(fighters[0].x>PX(136))fighters[0].x=PX(136);if(fighters[1].x>PX(136))fighters[1].x=PX(136);
   }
   update_shot(0);update_shot(1);
   if(++subsecond>=60){subsecond=0;if(seconds_left)seconds_left--;}
   if(!(frame&7))hud();if(!fighters[0].hp||!fighters[1].hp||!seconds_left)end_round();
  }
  else if(state==ROUND_END){if(state_timer)state_timer--;else if(wins[0]>=2||wins[1]>=2){state=RESULT;result_screen();continue;}else{if(winner!=2)round_no++;reset_round();}}
  else if(state==DIZZY){
   if(state_timer)state_timer--;
   if((winner==0&&((pressed&J_SELECT)||((keys&(J_A|J_B))==(J_A|J_B))))||(winner==1&&state_timer<110))do_finisher();
   else if(!state_timer){state=RESULT;result_screen();continue;}
  }
  else if(state==FINISHER){
   if(state_timer)state_timer--;shots[winner].y=PX(30+(180-state_timer)/3);
   if(!(state_timer&15))sfx(0);if(state_timer==110)announcement("R O S C A L I T Y !");
   if(!state_timer){state=RESULT;result_screen();continue;}
  }
  render();
 }
}

