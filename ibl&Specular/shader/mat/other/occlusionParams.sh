#ifndef OCCLUSION_PARAMS_SH
#define OCCLUSION_PARAMS_SH

USE_TEXTURE2D(tOcclusion);

float	sampleOcclusion( FragmentState s )
{
	return texture2D( tOcclusion, s.screenTexCoord ).x;
}

float	sampleOcclusion( FragmentState s, vec2 offset )
{
	return texture2D( tOcclusion, s.screenTexCoord + offset ).x;
}
#endif