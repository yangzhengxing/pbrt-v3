USE_TEXTURE2D(tInput);
USE_TEXTURE2D(tLensFlare);
USE_TEXTURE2D(tLensDirt);
USE_TEXTURE2D(tBloom);
USE_TEXTURE2D(tGrain);
USE_TEXTURE2D(tCurves);

uniform	vec3	uScale;
uniform vec3	uBias;
uniform vec3	uSaturation;
uniform vec4	uSharpenKernel;
uniform vec3	uSharpness;		// { sharpness, sharpness/4, sharpnessLimit }
uniform vec3	uBloomColor;
uniform vec4	uVignetteAspect;
uniform vec4	uVignette;
uniform vec4	uGrainCoord;
uniform vec2	uGrainScaleBias;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//rgba input
	vec4 c = texture2D( tInput, fCoord );

    //lens flare
	#ifdef LENSFLARE
    {
        vec2 dir = fCoord - vec2(0.5,0.5);
        vec3 lensFlare = vec3(	texture2D(tLensFlare, fCoord + 0.015 * dir).x,
                                texture2D(tLensFlare, fCoord).y,
                                texture2D(tLensFlare, fCoord - 0.015 * dir).z);
        lensFlare.xyz *= texture2D(tLensDirt, fCoord).xyz;
        c.xyz += lensFlare.xyz;
    }
	#endif

	//sharpen filter
	#ifdef SHARPEN
	{
		vec3
        samples	 = texture2D( tInput, fCoord + uSharpenKernel.xy ).xyz;
        samples	+= texture2D( tInput, fCoord - uSharpenKernel.xy ).xyz;
        samples	+= texture2D( tInput, fCoord + uSharpenKernel.zw ).xyz;
        samples	+= texture2D( tInput, fCoord - uSharpenKernel.zw ).xyz;
        
        vec3 delta = uSharpness.x*c.xyz - uSharpness.y*samples;
		c.xyz += clamp( delta, -uSharpness.z, uSharpness.z );
	}
	#endif

	//bloom
	#ifdef BLOOM
		c.xyz += uBloomColor * texture2D( tBloom, fCoord ).xyz;
	#endif
	
	//vignette
	vec2 vdist = fCoord*uVignetteAspect.xy - uVignetteAspect.zw;
	vec3 v = saturate( vec3(1.0,1.0,1.0) - uVignette.xyz*dot(vdist,vdist) );
	vec3 v3 = v*v; v3 *= v;
	c.xyz *= mix( v, v3, uVignette.w );

	//saturation
	float gray = dot( c.xyz, vec3(0.3,0.59,0.11) );
	c.xyz = mix( vec3(gray,gray,gray), c.xyz, uSaturation );

	//contrast
	c.xyz = c.xyz * uScale + uBias;

	//film grain
	float grain = uGrainScaleBias.x*texture2D( tGrain, fCoord*uGrainCoord.xy + uGrainCoord.zw ).x + uGrainScaleBias.y;
	c.xyz += c.xyz*grain;    

	//tone mapping
	#ifdef ToneMap
		c.xyz = ToneMap( c.xyz );
	#endif

	//color curves
	#ifdef CURVES
		vec3 curveCoord = (255.0/256.0)*c.xyz + vec3(0.5/256.0, 0.5/256.0, 0.5/256.0);
		c.x = texture2D( tCurves, curveCoord.xx ).x;
		c.y = texture2D( tCurves, curveCoord.yy ).y;
		c.z = texture2D( tCurves, curveCoord.zz ).z;
	#endif

	OUT_COLOR0 = c;
}