#ifndef MSET_SHADOW_PARAMS_H
#define MSET_SHADOW_PARAMS_H

USE_TEXTURE2D(tShadow);

vec3	sampleShadowMask( vec2 coord )
{
	return texture2D( tShadow, coord ).xyz;
}

#endif