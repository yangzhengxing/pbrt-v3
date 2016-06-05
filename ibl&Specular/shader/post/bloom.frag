USE_TEXTURE2D(tInput);

uniform	vec4	uKernel[BLOOM_SAMPLES];

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
	HINT_UNROLL
	for( int i=0; i<BLOOM_SAMPLES; ++i )
	{
		vec3 k = uKernel[i].xyz;
		c += texture2D( tInput, fCoord + k.xy ) * k.z;
	}

	OUT_COLOR0 = c;
}