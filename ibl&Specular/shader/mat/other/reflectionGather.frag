USE_TEXTURE2D(tReflectionCoord);
USE_TEXTURE2D(tReflectionMask);
USE_TEXTURE2D(tScreenColor);

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec3)
END_PARAMS
{
	//test mask first, do nothing for non-reflecting pixels
	vec2 tc = fCoord;
	vec3 color = vec3(0.0,0.0,0.0);
	vec3 m = vec3(1.0,1.0,1.0);

	//bounces
	HINT_UNROLL
	for( int i=0; i<4; ++i )
	{
		m *= texture2DLod( tReflectionMask, tc, 0.0 ).xyz;
		tc = texture2DLod( tReflectionCoord, tc, 0.0 ).xy;
		color += m * texture2DLod( tScreenColor, tc, 0.0 ).xyz;
	}

	OUT_COLOR0.xyz = color;
}