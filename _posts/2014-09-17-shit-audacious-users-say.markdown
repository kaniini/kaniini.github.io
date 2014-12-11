---
layout: post
title: "Hilarious shit that audacious users say"
---

This is just a collection of hilarious quotes we've seen over the years of working on [Audacious](http://audacious-media-player.org), a reasonably popular audio player.
If you want to know where a quote came from, just google it.  I've left these suckers fully unedited for your enjoyment.  The only emphasis added is bolding of the more
ridiculous parts, and hilarious replies which are on the same thread are kept in context.

> Advice I - The values of Crystalizer and Extra Stereo plugin are dependent on ur audio quality (mp3 bitrate for example), the type of music (Metal, Techno, Pop..etc), and ur speakers capabilities.
> **But an average value of 1.7 for both of them is just fine.**

> Before playing music, you go to the “Output” menu, “effects”, and select “crystalizer”. Open the Ouput-effects menu again and now you'll see an item “settings” under “crystalizer”.
> Select this and **set the crystalizer to 1.2** and close the setting. **This setting will undo the exaggerated compression of MP3 files.**
> Then go to the Output-effects menu again and select “Extra Stereo”. Go to the Output-effects menu again and click on the item “settings” that has now appeared under Extra Stereo.
> **Set it to 1.3** and close the setting. That will **compensate for the stereophonic effect loss due to MP3 compression**.

> Audacious is fast, lightweight and it has the best sound quality. **Personally I use it with a bit of crystalizer and extra stereo.**

> i was dumbstruck with the **audio quality pulseaudio + x-fi x-treme music + audacious media player with crystallizer plugin gave**, when i switched to linux

I would add more, but I don't feel like going over the various Linux distribution forums with a fine-toothed comb at this time.

You might notice a common theme here, if not it is basically this:

 * people clearly have no understanding of what the crystalizer and extra stereo plugins actually do, and
 * audiophiles seem to love using audacious.

A common misconception is that these plugins actually 'restore' audio data lost at various stages (mastering, encoding, etc.).
This couldn't be further from the truth.

The crystalizer plugin's name may seem arbitrary, but it's actually intentional: the plugin is named after the same feature marketed by Creative.  Creative claim:

> Hear sound so vibrant and so dynamic, being surprised is an understatement. SBX Crystalizer enhances the dynamic range of your compressed audio source to give you a more realistic experience.

What they really mean here is that the dynamic range of the audio is expanded.  The math behind this is simple and has been done since the 1980s, starting with the Aphex Aural Exciter,
there is nothing new with this.  Here is the basic algorithm shown in psuedo-code:

```python
samples = [series of left, right pairs]
prev = [0, 0]
for x in samples:
    x[0] = x[0] + (x[0] - prev[0])
    x[1] = x[1] + (x[1] - prev[1])
    prev = x
```

This is a simple delta-limited expander, there's nothing terribly new about it as I previously said.  The only thing here is a simple psychoaccoustic trick, the expansion enforces perception of the
peak amplitude of the pre-existing signal, nothing more.

Somehow people think that 'compression' means 'artifacting caused by lossy encoding', it doesn't... the literature is discussing the increased difficulty in perceiving amplitude extremes in audio
material mastered by idiots who think louder is better.

Is this plugin a cure for the loudness wars?  No -- not really.  However, many people have reported that the additional emphasis has resulted in a more enjoyable listening experience to their 1990s/2000s
audio collections.  Does the plugin restore your crappy MusicMatch 128kbps MP3 collection you ripped when you were a kid?  Definitely not.

As for the Extra Stereo plugin -- it just adds additional stereo separation.  The main benefit there is for headphone listeners as a lame substitute for proper crossfeed.  Headphone listeners might find
the BS2B plugin more useful.
