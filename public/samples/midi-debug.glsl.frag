// MIDI debugger
// Check if MIDI data is being received, notes and CC will be displayed

void main(){
  vec2 sp = gl_FragCoord.xy / u_resolution.xy;

  float notev = texture(u_midi_tex, sp).r;
  float cc = texture(u_midi_tex, sp).g;

  fragColor = vec4(cc, notev , cc, 0.1);
}