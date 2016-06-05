USE_TEXTURE2D(tInput);
USE_TEXTURE2D(tDepthInput);

uniform vec3	uFocus;	// { focusDist, frontScale, backScale }
uniform vec2	uPixelSize;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//look up depths
	vec4 depths;
	#ifdef TEXTURE_GATHER
		depths = textureGather( tDepthInput, fCoord );
	#else
		depths.x = texture2D( tDepthInput, fCoord + vec2(-.5,+.5)*uPixelSize ).x;
		depths.y = texture2D( tDepthInput, fCoord + vec2(+.5,+.5)*uPixelSize ).x;
		depths.z = texture2D( tDepthInput, fCoord + vec2(+.5,-.5)*uPixelSize ).x;
		depths.w = texture2D( tDepthInput, fCoord + vec2(-.5,-.5)*uPixelSize ).x;
	#endif

	//compute CoC from depths
	vec4 coc = (uFocus.xxxx - -depths) / -depths;
	//coc *= (-depths < uFocus.xxxx) ? uFocus.yyyy : uFocus.zzzz; //glsl doesnt like this
	coc *= mix( uFocus.zzzz, uFocus.yyyy, vec4(lessThan( -depths, uFocus.xxxx )) );
	coc = clamp( coc, -1.0, 1.0 );

	//look up colors 
	vec3 colors[4];
	#ifdef TEXTURE_GATHER_RGBA
		vec4 gr = textureGatherRed( tInput, fCoord );
		vec4 gg = textureGatherGreen( tInput, fCoord );
		vec4 gb = textureGatherBlue( tInput, fCoord );
		colors[0] = vec3( gr.x, gg.x, gb.x );
		colors[1] = vec3( gr.y, gg.y, gb.y );
		colors[2] = vec3( gr.z, gg.z, gb.z );
		colors[3] = vec3( gr.w, gg.w, gb.w );
	#else
		colors[0] = texture2D( tInput, fCoord + vec2(-.5,+.5)*uPixelSize ).xyz;
		colors[1] = texture2D( tInput, fCoord + vec2(+.5,+.5)*uPixelSize ).xyz;
		colors[2] = texture2D( tInput, fCoord + vec2(+.5,-.5)*uPixelSize ).xyz;
		colors[3] = texture2D( tInput, fCoord + vec2(-.5,-.5)*uPixelSize ).xyz;
	#endif

	//find average CoC
	float avgCoC = dot( coc, vec4(0.25,0.25,0.25,0.25) );
	vec3 finalColor = vec3(0.0,0.0,0.0);
	float finalCoC = 0.0; float finalWeight = 0.0;
	
	//reject pixels in front of the average depth from the average color
	#define	consider(color,c)\
	{	float w = saturate(c-avgCoC) < 0.05 ? 1.0 : 0.0;\
		finalColor += w * color;\
		finalCoC += w * c;\
		finalWeight += w;	}
	consider( colors[0], coc.x );
	consider( colors[1], coc.y );
	consider( colors[2], coc.z );
	consider( colors[3], coc.w );
	finalWeight = rcp( finalWeight );

	OUT_COLOR0.xyz = finalColor * finalWeight;
	OUT_COLOR0.w = finalCoC * finalWeight;
}