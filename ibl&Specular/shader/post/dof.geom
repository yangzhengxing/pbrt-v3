USE_TEXTURE2D(tInput);

uniform vec4	uGridDimensions;	//{ w, h, 1/w, 1/h }
uniform vec4	uTextureDimensions;	//{ w, h, 1/w, 1/h }
uniform vec2	uBokehSize;
uniform vec4	uBokehRotation;		//{ x0, x1, y0, y1 }
uniform vec2	uBokehSwirl;

uniform vec4	cQuadCorners[4];
uniform vec4	cOffsets[4];

BEGIN_INPUTS
END_INPUTS

BEGIN_OUTPUTS
	OUTPUT0(vec4,fColor)
	OUTPUT1(vec2,fCoord)
END_OUTPUTS

struct	Bokeh
{
	vec4	color;
	vec2	corners[4];
	vec2	texcoords[4];
	vec2	pixelSize;
};

void	generateBokeh( out Bokeh b, vec3 color, vec2 ndcPos, float CoC, bool coversFour )
{
	vec2 size = CoC * uBokehSize;
	b.pixelSize = size * uTextureDimensions.xy;

	float areaPixels = b.pixelSize.x * b.pixelSize.y;
	b.color.a = rcp( areaPixels );
	b.color.rgb = color * b.color.a;
	if( coversFour )
	{ b.color *= 4.0; }
	
	if( uBokehSize.y >= 0.0 )
	{
		//near field should fade as bokeh size shrinks
		b.color *= saturate( (1.0/2.0)*b.pixelSize.y - 1.0 );
	}

	HINT_UNROLL
	for( int i=0; i<4; ++i )
	{
		vec4 o = cQuadCorners[i];
		b.corners[i] = ndcPos + size*(o.x*uBokehRotation.xy + o.y*uBokehRotation.zw);
		
		//swirl vignette
		vec2 dir = ndcPos * uBokehSwirl;
		b.corners[i] -= dot( b.corners[i] - ndcPos, dir ) * dir;
		b.color *= 1.0 + 0.25*dot(dir,dir);

		b.texcoords[i] = o.zw;
	}
}

GEOMETRY( POINTS_IN, TRIANGLES_OUT, 16 )
{
	const float minBokehPixelSize = 2.0;
	
	//determine screen position & screen texcoord [0,1]
	vec2 tc;
	tc.x = mod( float(PRIMITIVE_ID), uGridDimensions.x );
	tc.y = floor( float(PRIMITIVE_ID) * uGridDimensions.z );
	tc *= uGridDimensions.zw;
	tc += uGridDimensions.zw * 0.5;
	vec2 pos = 2.0*tc - vec2(1.0,1.0);
	#ifdef RENDERTARGET_Y_DOWN
		tc.y = 1.0 - tc.y;
	#endif

	//sample screen color and CoC
	vec4 samples[4];
	HINT_UNROLL
	for( int s=0; s<4; ++s )
	{ samples[s] = texture2DLod( tInput, tc + cOffsets[s].zw*uTextureDimensions.zw, 0.0 ); }

	//determine whether to generate 4 quads or just 1
	vec4 mn = min( min( min( abs(samples[0]), abs(samples[1]) ), abs(samples[2]) ), abs(samples[3]) );
	vec4 mx = max( max( max( abs(samples[0]), abs(samples[1]) ), abs(samples[2]) ), abs(samples[3]) );
	vec4 variance = mx - mn;
	float maxColorDiff = max( max( variance.x, variance.y ), variance.z );
	float colorThreshold = saturate( 0.33 * mn.w * abs(uBokehSize.y) * uTextureDimensions.y - 1.0 );
	colorThreshold *= colorThreshold;
	float cocVarianceThreshold = 0.04 * mx.w;

	HINT_BRANCH
	if( variance.w > cocVarianceThreshold || maxColorDiff > 0.1*colorThreshold )
	{
		//generate 4 quads from 4 sample pixels
		HINT_UNROLL
		for( int q=0; q<4; ++q )
		{
			Bokeh bk;
			generateBokeh(	bk,
							samples[q].xyz,
							pos + cOffsets[q].xy*uTextureDimensions.zw,
							samples[q].w,
							false );
			HINT_BRANCH
			if( bk.pixelSize.y >= minBokehPixelSize )
			{
				OUT(fColor) = bk.color;
				OUT_POSITION.zw = vec2( 0.5, 1.0 );

				HINT_UNROLL
				for( int i=0; i<4; ++i )
				{
					OUT_POSITION.xy = bk.corners[i];
					OUT(fCoord) = bk.texcoords[i];
					EMIT_VERTEX;
				}
				END_PRIMITIVE;
			}
		}
	}
	else
	{
		//generate 1 quad from 4 sample pixels (pixels are similar enough)
		vec4 avg = 0.25*(samples[0] + samples[1] + samples[2] + samples[3]);

		Bokeh bk;
		generateBokeh( bk, avg.xyz, pos, avg.w, true );
		HINT_BRANCH
		if( bk.pixelSize.y >= minBokehPixelSize )
		{
			OUT(fColor) = bk.color;
			OUT_POSITION.zw = vec2( 0.5, 1.0 );

			HINT_UNROLL
			for( int i=0; i<4; ++i )
			{
				OUT_POSITION.xy = bk.corners[i];
				OUT(fCoord) = bk.texcoords[i];
				EMIT_VERTEX;
			}
			END_PRIMITIVE;
		}
	}
}