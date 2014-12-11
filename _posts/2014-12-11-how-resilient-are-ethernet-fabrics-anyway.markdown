---
layout: post
title: "How resilient are ethernet fabrics anyway"
---

*This post is part of a series wherein we break various networks, using a transparent bridge lovingly called "[the apparatus][kafka]". In this series, we're going to learn how distributed systems intersect with the modern physical network, and why certain approaches and topologies are best avoided. In this particular post, we will discuss the CAP theorem and how it applies to network fabrics of varying design, as well as the design and implementation of the apparatus.*

[kafka]: http://www.kafka-online.info/in-the-penal-colony.html

Physical networks are a suspenseful place these days, with many questions like: *did the peer switch get my frame?* and *is that equal-cost path really available?*  Indeed, the network has evolved from the acyclic graph architecture imposed by STP in the 1990s.  With various technologies such as [data-center bridging][DCB] and [transparent interconnection of lots of links][TRILL], it seems everyone has a solution for converting ethernet from an acyclic graph to a mesh topology.  The problem however, is that the new solution assumes the physical network is *synchronous*.  In reality, this is not the case: most networks are *not* perfectly synchronous.  Media conversion for example will always be asynchronous, and a bad cable or optical module can introduce significant degradation along a path.

[DCB]: http://en.wikipedia.org/wiki/Data_center_bridging
[TRILL]: http://en.wikipedia.org/wiki/TRILL_(computing)

Modern network "fabrics" are composed of multiple components and protocols, ultimately communicating over an asynchronous physical network.  Therefore, understanding the *reliability* of a fabric requires careful analysis of both the physical network and the components which implement the fabric in failure situations.  As fabrics convert the network into a truly distributed system, we can evaluate the underlying components using the CAP theorem to determine what tradeoffs are made by the fabric.  Like many hard problems in computing, distributed network fabrics come down to handling of shared state, so the CAP theorem fully applies here.

### Creating an intentionally unreliable network: introducing the "apparatus"

The apparatus is a server appliance which operates a virtual switch with some interesting properties.  The main interesting property is our use of [netmap-enabled ipfw][netmap] to selectively forward ethernet frames based on dummynet link emulation.  For those interested, here are the specifications of the server:

* Dual Intel E5620 processors
* FreeBSD 10.1-CURRENT with NETMAP enabled
* 2 x Intel 82599ES dual-port 10GBe NIC (4 x SFP+ ports total)

With netmap, we can natively forward the full 40GBe capacity available to the machine with proper tunings on a simple ipfw ruleset, which is all we need for these experiments.

[netmap]: https://code.google.com/p/netmap-ipfw/

We use netmap with some python scripting to manage the control plane of the vSwitch.  This allows us to manipulate the running configuration in a programmatic manner, thus ensuring reproduceable results.  As a result of using netmap-based ipfw, we are able to forward unmodified ethernet frames, allowing any form of layer-2 protocol through the vSwitch, thusly providing a truly transparent bridge which can be completely unaware of the actual contents of the frames being forwarded.  This allows us to support extensions such as Brocade's ISL trunking without difficulty.

### Network Partitions

In distributed systems theory, a formal proof often assumes the network is *asynchronous*: in other words, that messages between peers are allowed to be arbitrarily dropped, reordered, duplicated and delayed.  In practice, this is a reasonable hypothesis; while some physical networks such as Infiniband can provide stronger guarantees, IP and Ethernet-based networks will likely encounter all of these issues.

In practice, detecting absolute network failure is difficult.  In a fabric, since our only knowledge of other peers passes through the network, delays caused by degraded links are indistinguishable from any other traffic.  This is the fundamental problem with a network *partition*, they are rarely a true hard-failure but instead just a source of massive packet loss.  Further, when partitions do arise, we have few options for diagnosing the cause, resulting in the need for an intervention.  When the partition heals, the fabric controller software has to later work out what happened and try to recover from it, but how well does it do that in the result of inconsistency?

In this series, I intend to set up real ethernet fabrics and break them in various ways, observing the results.  We will ultimately run an application (the netmap traffic generator) to generate traffic across the fabric, observing how many packets are permanently lost or duplicated by the fabric, as well as attempt to induce split-brain configurations by manipulating the fabric's configuration on all sides of the network partition.