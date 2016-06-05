USE_TEXTURE2D(tInput);
USE_TEXTURE2D(tBokeh);

uniform vec4	uBokehTransform;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec3)
END_PARAMS

{
	vec3 c = vec3(0.0, 0.0, 0.0);
	vec3 bokehAccumulation = vec3(0.0,0.0,0.0);

	#define SAMPLES 32
	for( int i=0; i<SAMPLES; ++i )
	{
		HINT_UNROLL
		for( int j=0; j<SAMPLES; ++j )
		{
			vec2 uv = vec2( (float(i)+0.5)/float(SAMPLES), (float(j)+0.5)/float(SAMPLES) );
			vec3 bokehtex = texture2D( tBokeh, uv ).xyz;
			bokehAccumulation += bokehtex;
			
			vec2 offset = uv - vec2(0.5,0.5);
			vec2 coord = (fCoord + offset.x*uBokehTransform.xy) + offset.y*uBokehTransform.zw;
			c.xyz += bokehtex * texture2D( tInput, coord ).xyz;
		}
	}

	OUT_COLOR0.xyz = c / bokehAccumulation;
}