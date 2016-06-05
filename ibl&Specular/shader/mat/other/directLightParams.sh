#ifndef DIRECT_LIGHT_PARAMS_SH
#define DIRECT_LIGHT_PARAMS_SH

uniform vec4	uDirectLightPosition;		// { x, y, z, directional ? 0 : 1 }
uniform vec3	uDirectLightColor;			// { r, g, b }
uniform vec3	uDirectLightAttenuation;	// { -2a, a-b, 1/radius }
uniform vec3    uDirectLightX;				// axes for area lights
uniform vec3    uDirectLightY;
uniform vec3	uDirectLightSize;			// { x, y, z }, z is 'radius'

struct	LightParams
{
	vec3	color;			// "colour"
	vec3	toSource;		// vector from shaded point to light
	vec3	direction;		// normalized vector to light
	float	invDistance;	// 1/distance to light
	float	distance;		// distance to light
	float	attenuation;	// dimming (distance and other factors)
};

LightParams	getLight( vec3 shadedPosition )
{
	LightParams p;

	//color
	p.color = uDirectLightColor;

	//light vectors
	p.toSource = uDirectLightPosition.xyz - shadedPosition * uDirectLightPosition.w;
	p.invDistance = rsqrt( dot(p.toSource, p.toSource) );
	p.distance = rcp( p.invDistance );
	p.direction = p.toSource * p.invDistance;

	//distance attenuation
	float a = saturate( p.distance * uDirectLightAttenuation.z );
	p.attenuation = 1.0 + uDirectLightAttenuation.x*a + uDirectLightAttenuation.y*a*a;

	return p;
}

void		adjustAreaLightDiffuse( inout LightParams p, vec3 pos )
{
	HINT_BRANCH
	if( uDirectLightSize.x + uDirectLightSize.y > 0.0 )
	{
		vec2 uv = vec2( dot(-p.toSource,uDirectLightX), dot(-p.toSource,uDirectLightY) );
		uv = clamp( uv, -uDirectLightSize.xy, uDirectLightSize.xy );
		p.toSource += uv.x*uDirectLightX + uv.y*uDirectLightY;
		p.invDistance = rsqrt( dot(p.toSource, p.toSource) );
		p.distance = rcp( p.invDistance );
		p.direction = p.toSource * p.invDistance;

		float a = saturate( p.distance * uDirectLightAttenuation.z );
		p.attenuation = 1.0 + uDirectLightAttenuation.x*a + uDirectLightAttenuation.y*a*a;
	}
}

bool		adjustAreaLightSpecular( inout LightParams p, vec3 dir, float nrm )
{
	vec3 L = p.toSource;
	bool hit = false;

	//2-axis case
	HINT_BRANCH
	if( uDirectLightSize.x + uDirectLightSize.y > 0.0 )
	{
		//project our vector onto the plane
		vec3 planeNormal = cross( uDirectLightX, uDirectLightY );
		float t = dot( L, planeNormal ) / dot( dir, planeNormal );
		vec3 p0 = t * dir;

		//transform point to 2D plane coords
		vec3 r = p0 - L;
		vec2 uv = vec2( dot(r,uDirectLightX), dot(r,uDirectLightY) );

		//see if the reflection vector hits the rectangle
		hit = abs(uv.x) < uDirectLightSize.x && abs(uv.y) < uDirectLightSize.y;
		if( !hit )
		{
			//ray doesn't intersect quad; check all 4 sides, find closest point on edge
			vec3 bestP = L; float bestDot = 0.0;
			HINT_UNROLL
			for( int i=0; i<4; ++i )
			{
				vec3 ld = i>1 ? uDirectLightX : uDirectLightY;
				vec2 sz = i>1 ? uDirectLightSize.xy : uDirectLightSize.yx;
				vec3 l0 = L + sz.y * (i>1 ? uDirectLightY : uDirectLightX) * ((i%2)!=0 ? -1.0 : 1.0);
					
				float dirL0 = dot(dir,l0), dirld = dot(dir,ld), l0ld = dot(l0,ld);
				float t = (l0ld*dirL0 - dot(l0,l0)*dirld) / (l0ld*dirld - dot(ld,ld)*dirL0);
				t = clamp( t, -sz.x, sz.x );
				vec3 P = l0 + t*ld;

				float dp = dot( normalize(P), dir );
				HINT_FLATTEN
				if( dp > bestDot )
				{ bestP = P; bestDot = dp; }
			}
			L = bestP;
		}
		else
		{ L = p0; }
	}

	//'thickness'
	HINT_BRANCH
	if( uDirectLightSize.z > 0 )
	{
		//closest point on sphere to ray
		vec3 closestPoint = dot(L, dir) * dir;
		vec3 centerToRay = closestPoint - L;
		float t = uDirectLightSize.z * rsqrt( dot(centerToRay, centerToRay) );
		L = L + centerToRay * saturate(t);

		hit = hit || (t > 1.0 || t < 0.0);
	}

	//energy conservation estimate
	float sizeGuess = uDirectLightSize.x + uDirectLightSize.y + uDirectLightSize.z;
	float solidAngleGuess = saturate( sizeGuess * p.invDistance );
	p.attenuation *= rcp( 1.0 + nrm * solidAngleGuess );

	//export
	p.toSource = L;
	p.direction = normalize( p.toSource );
	return hit;
}

#endif