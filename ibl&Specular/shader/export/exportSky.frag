USE_TEXTURECUBE(tSky);

uniform vec4	uRands[IMPORTANCE_SAMPLES];
uniform float	uBrightness;

#define	PI	3.14159265359

BEGIN_PARAMS
	INPUT0(vec2,fCoord)
	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//determine direction from octahedral layout
	vec3 dir;
	{
		vec2 uv = fCoord;
		uv.y = fract( uv.y * 8.0 );
		uv = 2.0*uv - vec2(1.0,1.0);
		if( (abs(uv.x) + abs(uv.y)) <= 1.0 )
		{
			//positive hemisphere
			dir = vec3( uv.x, 1.0-abs(uv.x)-abs(uv.y), uv.y );
		}
		else
		{
			//negative hemisphere
			vec2 signuv = sign(uv);
			uv = signuv - (signuv.x*signuv.y)*uv.yx;
			dir = vec3( uv.x, abs(uv.x)+abs(uv.y)-1.0, uv.y );
		}
		dir = normalize(dir);
	}
	
	//determine gloss
	float gloss = floor( fCoord.y * 8.0 ) / 7.0;
	
	//default is just regular sample
	vec3 s = textureCube( tSky, dir ).xyz;

	//brute force samples for convolution
	HINT_BRANCH
	if( gloss < 0.999 )
	{
		float specExp = pow( 8.0, gloss * 3.0 );
		vec3 basisX = normalize( cross( dir, vec3(0.0, 1.0, saturate(dir.y*10000.0 - 9999.0) ) ) );
		vec3 basisY = cross( basisX, dir );
		vec3 basisZ = dir;
		s = vec3( 0.0, 0.0, 0.0 );

		HINT_LOOP
		for( int i=0; i<IMPORTANCE_SAMPLES; ++i )
		{
			vec3 r;
			{
				vec4 rnd = uRands[i];
				float cos_theta = pow( rnd.x, 1.0 / (specExp + 1.0) );
				float sin_theta = sqrt( 1.0 - cos_theta*cos_theta );
				float cos_phi = rnd.z, sin_phi = rnd.w;
				r = vec3( cos_phi*sin_theta, sin_phi*sin_theta, cos_theta );
				r = r.x*basisX + r.y*basisY + r.z*basisZ;
			}

			float pdf = (0.5*specExp + 1.0) * pow( saturate( dot( dir, r ) ), specExp );
			float lod = (0.5 * log2( (256.0*256.0)/float(IMPORTANCE_SAMPLES) ) + 1.5) - 0.5*log2( pdf );
			s += (1.0/float(IMPORTANCE_SAMPLES)) * textureCubeLod( tSky, r, lod ).xyz;
		}
	}

	vec4 r; r.xyz = s * uBrightness; r.w = 1.0;
	{
		//RGBM encode
		vec3 v = (1.0/7.0)*sqrt(r.xyz);
		float m = saturate( max( v.x, max( v.y, v.z ) ) );
		m = ceil( m * 255.0 ) / 255.0;
		if( m > 0.0 )
		{ r.xyz = v.xyz / m; }
		r.w = m;
	}
	OUT_COLOR0 = r;
}