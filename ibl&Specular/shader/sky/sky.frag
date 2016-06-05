USE_TEXTURECUBE(tSkyTexture);
uniform float	uSkyBrightness;

BEGIN_PARAMS
	INPUT0(vec3,skyBoxCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec4 s = textureCube( tSkyTexture, skyBoxCoord );
	s.xyz *= uSkyBrightness;
	OUT_COLOR0 = s;
}