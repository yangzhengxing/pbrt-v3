USE_TEXTURE2D(tDepth);
USE_TEXTURE2D(tNormal);
USE_TEXTURE2D(tNoise);

uniform vec4	uKernel[SAMPLE_COUNT];
uniform vec4	uUnproject;		// { -2/proj[0][0], -2/proj[1][1], (1-proj[2][0])/proj[0][0], (1-proj[2][1])/proj[1][1] }
uniform vec4	uNoiseScaleBias;
uniform float	uAspectRatio;
uniform float	uStrength;

vec3	sampleNormal( vec2 coord )
{
	vec3 n;
	n.xy = texture2DLod( tNormal, coord, 0.0 ).xy;
	n.z = sqrt( 1.0 - dot(n.xy,n.xy) );
	return n;
}

vec3	samplePosition( vec2 coord )
{
	vec3 p;
	p.z = texture2DLod( tDepth, coord.xy, 0.0 ).x;
	p.xy = p.z * ( coord * uUnproject.xy + uUnproject.zw );
	return p;
}

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(float)
END_PARAMS
{
	vec3 centerPos = samplePosition( fCoord );
	
	float ao = 1.0;
	HINT_BRANCH
	if( centerPos.z <= 0.0 && centerPos.z > -1.0e11 )
	{
		vec3 centerNorm = sampleNormal(fCoord);
		float distFactor = 1.0 / ( -centerPos.z * 0.1 );

		vec4 noise = texture2DLod( tNoise, fCoord * uNoiseScaleBias.xy + uNoiseScaleBias.zw, 0.0 );
		noise = 2.0*noise - vec4(1.0,1.0,1.0,1.0);
		noise.xz *= uAspectRatio;

		ao = 0.0;
		HINT_UNROLL
		for( int i=0; i<SAMPLE_COUNT; ++i )
		{
			vec2 k = uKernel[i].xy;
			vec2 c = (fCoord + noise.xy*k.x) + noise.zw*k.y;
			vec3 p = samplePosition( c );
			
			vec3 d = normalize( p - centerPos );
			float dp = saturate( dot( d, centerNorm ) );
			float occ = (1.0 - dp*dp); //skipping sqrt for speed
			
			float distfade = saturate( (p.z - centerPos.z) * distFactor );
			occ = max( occ, distfade );
			
			ao += (1.0/float(SAMPLE_COUNT))*occ;
		}

		ao = pow( ao, uStrength );
	}

	OUT_COLOR0 = ao;
}