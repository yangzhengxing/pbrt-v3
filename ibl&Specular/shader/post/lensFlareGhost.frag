USE_TEXTURE2D(tInput);
USE_TEXTURE2D(tLensColor);

uniform float   uLensFlareStrength;
uniform float   uLensFlareContrast;
uniform vec2    uLensFlareAspect;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS

{
	vec4 c = vec4(0.0,0.0,0.0,0.0);
	vec2 invCoord = -fCoord + vec2(1.0,1.0);
	
	//ghosts
	vec2 ghostVec = (vec2(0.5,0.5) - invCoord) * 0.2;
	for( int i=0; i<9; ++i )
	{
		vec2 offset = invCoord + ghostVec * float(i);

		float weight = length(vec2(0.5,0.5) - offset) / length(vec2(0.5,0.5));
		weight = pow(1.0 - weight, 25.0);

		vec3 s = texture2D( tInput, offset ).xyz;
		s = max( vec3(0.0,0.0,0.0), s - uLensFlareContrast );
		s = uLensFlareContrast * s + s;
		c.xyz += s * weight;
	}

	//lens halo
	vec2 aspectCoord = uLensFlareAspect * (invCoord - vec2(0.5,0.5)) + vec2(0.5,0.5);
	vec2 haloVec = normalize(vec2(0.5,0.5) - aspectCoord) * 0.5;
	float weight = length(vec2(0.5,0.5) - (aspectCoord + haloVec)) / length(vec2(0.5,0.5));
	weight = pow(1.0 - weight, 5.0);
	c.xyz += texture2D( tInput, aspectCoord + haloVec ).xyz * weight * 0.1;

	//lens color gradient
	c.xyz *= texture2D(tLensColor, vec2(length(vec2(0.5,0.5) - aspectCoord) / length(vec2(0.5,0.5)), 0.0)).xyz * 0.25;

	//overall strength
	c.xyz *= uLensFlareStrength;

	OUT_COLOR0 = c;
}