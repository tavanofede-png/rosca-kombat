#ifndef ART_H
#define ART_H
#include <gb/cgb.h>
extern const unsigned char fighter_0[];
extern const unsigned char portrait_0[];
extern const unsigned char fighter_1[];
extern const unsigned char portrait_1[];
extern const unsigned char fighter_2[];
extern const unsigned char portrait_2[];
extern const unsigned char fighter_3[];
extern const unsigned char portrait_3[];
extern const unsigned char fighter_4[];
extern const unsigned char portrait_4[];
extern const unsigned char fighter_5[];
extern const unsigned char portrait_5[];
extern const unsigned char fighter_6[];
extern const unsigned char portrait_6[];
extern const unsigned char fighter_7[];
extern const unsigned char portrait_7[];
extern const unsigned char fighter_8[];
extern const unsigned char portrait_8[];
extern const unsigned char fighter_9[];
extern const unsigned char portrait_9[];
extern const unsigned char fighter_10[];
extern const unsigned char portrait_10[];
extern const unsigned char fighter_11[];
extern const unsigned char portrait_11[];
extern const unsigned char fighter_12[];
extern const unsigned char portrait_12[];
extern const unsigned char fighter_13[];
extern const unsigned char portrait_13[];
extern const unsigned char fighter_14[];
extern const unsigned char portrait_14[];
extern const unsigned char fighter_15[];
extern const unsigned char portrait_15[];
extern const unsigned char fighter_16[];
extern const unsigned char portrait_16[];
extern const unsigned char fighter_17[];
extern const unsigned char portrait_17[];
extern const unsigned char fighter_18[];
extern const unsigned char portrait_18[];
extern const unsigned char fighter_19[];
extern const unsigned char portrait_19[];
extern const unsigned char fighter_20[];
extern const unsigned char portrait_20[];
extern const unsigned char fighter_21[];
extern const unsigned char portrait_21[];
extern const unsigned char fighter_22[];
extern const unsigned char portrait_22[];
extern const unsigned char fighter_23[];
extern const unsigned char portrait_23[];
extern const unsigned char fighter_24[];
extern const unsigned char portrait_24[];
extern const unsigned char fighter_25[];
extern const unsigned char portrait_25[];
extern const unsigned char fighter_26[];
extern const unsigned char portrait_26[];
extern const unsigned char fighter_27[];
extern const unsigned char portrait_27[];
extern const unsigned char fighter_28[];
extern const unsigned char portrait_28[];
extern const unsigned char fighter_29[];
extern const unsigned char portrait_29[];
extern const unsigned char fighter_30[];
extern const unsigned char portrait_30[];
extern const unsigned char fighter_31[];
extern const unsigned char portrait_31[];
extern const unsigned char stage_0_tiles[],stage_0_map[],stage_0_attr[];
extern const palette_color_t stage_0_palette[];
#define STAGE_0_COUNT 88
extern const unsigned char stage_1_tiles[],stage_1_map[],stage_1_attr[];
extern const palette_color_t stage_1_palette[];
#define STAGE_1_COUNT 59
extern const unsigned char stage_2_tiles[],stage_2_map[],stage_2_attr[];
extern const palette_color_t stage_2_palette[];
#define STAGE_2_COUNT 114
extern const unsigned char stage_3_tiles[],stage_3_map[],stage_3_attr[];
extern const palette_color_t stage_3_palette[];
#define STAGE_3_COUNT 88
extern const unsigned char icons[];
const unsigned char * const fighter_art[]={fighter_0,fighter_1,fighter_2,fighter_3,fighter_4,fighter_5,fighter_6,fighter_7,fighter_8,fighter_9,fighter_10,fighter_11,fighter_12,fighter_13,fighter_14,fighter_15,fighter_16,fighter_17,fighter_18,fighter_19,fighter_20,fighter_21,fighter_22,fighter_23,fighter_24,fighter_25,fighter_26,fighter_27,fighter_28,fighter_29,fighter_30,fighter_31};
const unsigned char * const portrait_art[]={portrait_0,portrait_1,portrait_2,portrait_3,portrait_4,portrait_5,portrait_6,portrait_7,portrait_8,portrait_9,portrait_10,portrait_11,portrait_12,portrait_13,portrait_14,portrait_15,portrait_16,portrait_17,portrait_18,portrait_19,portrait_20,portrait_21,portrait_22,portrait_23,portrait_24,portrait_25,portrait_26,portrait_27,portrait_28,portrait_29,portrait_30,portrait_31};
const palette_color_t * const stage_palettes[]={stage_0_palette,stage_1_palette,stage_2_palette,stage_3_palette};
const unsigned char * const stage_art[]={stage_0_tiles,stage_1_tiles,stage_2_tiles,stage_3_tiles};
const unsigned char * const stage_maps[]={stage_0_map,stage_1_map,stage_2_map,stage_3_map};
const unsigned char * const stage_attrs[]={stage_0_attr,stage_1_attr,stage_2_attr,stage_3_attr};
const unsigned char stage_counts[]={STAGE_0_COUNT,STAGE_1_COUNT,STAGE_2_COUNT,STAGE_3_COUNT};
#endif
