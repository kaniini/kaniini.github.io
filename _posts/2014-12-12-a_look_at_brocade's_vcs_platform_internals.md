---
layout: post
title: "How does Brocade's VCS stack up for resiliency?"
---

*This post is part of a series wherein we break various networks, using a transparent bridge lovingly called "[the apparatus][kafka]". In this series, we're going to learn how distributed systems intersect with the modern physical network, and why certain approaches and topologies are best avoided. In this particular post, we explore Brocade's VCS platform, as implemented on it's VDX switches, and test various failure domains using the apparatus.*

[kafka]: http://www.kafka-online.info/in-the-penal-colony.html

Brocade's VCS platform is built on-top of [TRILL][TRILL] and [Data-Center Bridging][DCB] as the underlying primitives, and [Brocade's proprietary ISL trunking extensions][brocade-isl] for peer discovery.  This type of approach is fairly common for 'fabric' architectures.  The interesting thing is that Brocade's implementation uses a [different routing protocol, FSPF][brocade-note-1] rather than IS-IS for the link-state routing protocol as required by TRILL.  The most similar technology, Cisco's [FabricPath][fabricpath] as used with their Nexus switching platform, uses IS-IS with custom extensions instead.

[TRILL]: http://en.wikipedia.org/wiki/TRILL_%28computing%29
[DCB]: http://en.wikipedia.org/wiki/Data_center_bridging
[brocade-isl]: http://www.brocade.com/downloads/documents/data_sheets/product_data_sheets/isl-trunking-ds.pdf
[brocade-note-1]: http://vimeo.com/41513961#t=250s
[fabricpath]: http://www.networkworld.com/article/2187263/lan-wan/dissecting-cisco-s-fabricpath-ethernet-technology.html

### The Brocade VCS cluster itself

The fundamentals behind the VCS platform seem reasonable, but how does the clustering itself work?  The configuration is merged using a protocol called BLDP, which is a subset of Brocade's ISL trunking extensions.  BLDP handles discovery of peers and joining the peer switch into the fabric, as long as the following requirements pass testing:

1. The two peers must both speak the same version of the BLDP protocol.
2. The two peers must have the same BLDP cluster ID configured.
3. The primary switch must have an `rbridge-id` available for the new peer.  Up to 239 `rbridge-id`s are available for a fabric to use.

You might have noticed I said "primary switch" here and may be confused as [Brocade's sales literature for the VDX][brocade-vdx-sales-1] says:

> Unlike other Ethernet fabric architectures, Brocade VCS fabrics are masterless and can be designed in full mesh, partial mesh, leaf-spine, and various other topologies, and they are easily modified or fine-tuned as application demands change over time.

This does not actually mean there is no primary or master switch, which is contrary to how most people might interpret this statement.  In other words, Brocade are spinning reality.  What they mean here is that there is no *explicit* master switch to configure, however their documentation very clearly uses terminology such as "coordinating switch" and "primary switch", which can be interchanged with "master" here.

[brocade-vdx-sales-1]: http://www.brocade.com/solutions-technology/technology/vcs-technology/details.page

#### Master election

As the VCS is a distributed system which uses a broker to coordinate transactions, a master node must be elected as the broker.  According to [Brocade's documentation][brocade-nos-docs], this procedure takes place to elect the master node:

1. Every switch at startup designates itself as a potential master and advertises solicitations that it wants to be the master on all trunk ports.
2. At election time, all solicitations are compared.  The solicitation has two fields: the switch WWN (a 64-bit unique identifier), and a priority level.  At cold-boot, the priority level is the same for all switches.
3. The solicitation with the lowest WWN (integer comparison) and highest priority wins.  Priority is preferred over WWN, so that the administrator may specifically nominate a switch as master.
4. At the end of the election process, the entire fabric's peer group has been encapsulated into an acyclic graph with the master switch at the root.

[brocade-nos-docs]: http://www.brocade.com/downloads/documents/product_manuals/B_VDX/NOS_AdminGuide_v410.pdf

At the end of the election, some conflict resolution has already occured: if a switch has an *explicit* `rbridge-id` assigned to it which conflicts with a pre-existing node then the switch is not allowed to join the fabric.  In this situation a manual intervention is required: the explicit `rbridge-id` must either be changed or removed from the partitioned switch, and the links must be recycled - this is usually accomplished by rebooting the partitioned switch.  This seems to fall short of Brocade's promise of a zero-configuration fabric, but isn't terrible in and of itself.

#### Configuration merging

In the event of a network partition, what does the VCS system do?  [Brocade's documentation][brocade-nos-docs] describes a strategy it calls a "trivial merge", wherein the losing side of the partition loses it's configuration and has it's configuration entirely replaced by the configuration on the winning side of the partition.  The winning side is determined by the number of peers on both sides of the partition, and the last update time on the configuration.

This means that consistency is given up by the clustering system when operating in logical chassis mode, leaving us with a distributed system that has AP qualities in both the configuration and forwarding planes.  But does it really work?  What happens when both sides of a partition are equal and the last update time is very close?  Lets find out.

For this test, we configure a network topology consisting of 2 groups of 4 switches linked together directly and a shared path passing through [the apparatus][apparatus].  This allows us to create an even partition by simply taking the ports connecting the two sides offline, at which time we will update the configuration on both master nodes.

[apparatus]: http://kaniini.dereferenced.org/2014/12/11/how-resilient-are-ethernet-fabrics-anyway.html

The result?  A split-brained cluster:

    Cluster has been formed, topology:
       master: 192.168.140.1
       n1: 127.1.0.1
         |-- n2: 127.1.0.2
         |-- n3: 127.1.0.3
         `-- n4: 127.1.0.4
               |-- n5: 127.1.0.5
               |-- n6: 127.1.0.6
               |-- n7: 127.1.0.7
               `-- n8: 127.1.0.8
    Severing link between n4 and n5 ('ix0', 'ix1')!
    side 1 master: 192.168.140.1 pings!
    side 2 master: 192.168.140.1 pings!
    Inserting 50 VLAN definitions on side 1 and side 2:
    side 1: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    side 2: [51, 52, 53, 54, 55, 56 .. 95, 96, 97, 98, 99, 100]
    Synchronized change commits.
    Healing partition between n4 and n5 ('ix0', 'ix1')!
    Master 192.168.140.1 belongs to n1.
    Checking for survivors.
    50 survivor VLANs on the master.
    Checking configuration consistency for n4 vs n5.
    n4: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    n5: [51, 52, 53, 54, 55, 56 .. 95, 96, 97, 98, 99, 100]
    n4 and n5 are inconsistent!
    The cluster is SPLIT BRAIN: 50 inconsistent configuration nodes. (╯°□°）╯︵ ┻━┻

Ouch.  At least the election algorithm works as described.  This indicates that they are using per-second resolution on the configurations, as we can not get a perfect sync on clocks due to clock skew.  I guess we shouldn't be that surprised, as the "trivial merge" description did outright advise us that consistency goes right out the window.

However, does the split brain status result in *packet loss*?  We repeat the same test as above, but with an added pair of loopback paths passing back through the apparatus.  This allows us to run `pkt-gen.c`, as included with netmap to determine if the fabric is still *available* in such a configuration.  The result?  Packet loss if the return path crosses the partition boundary:

    Cluster has been formed, topology:
       master: 192.168.140.1
       n1: 127.1.0.1
         |-- n2: 127.1.0.2
         |-- n3: 127.1.0.3
         `-- n4: 127.1.0.4
               |-- n5: 127.1.0.5
               |-- n6: 127.1.0.6
               |-- n7: 127.1.0.7
               `-- n8: 127.1.0.8
    Configuring VLAN tags:
       TenGigabitEthernet 4/0/2: 45
       TenGigabitEthernet 5/0/2: 45
    Severing link between n4 and n5 ('ix0', 'ix1')!
    side 1 master: 192.168.140.1 pings!
    side 2 master: 192.168.140.1 pings!
    Inserting 50 VLAN definitions on side 1 and side 2:
    side 1: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    side 2: [51, 52, 53, 54, 55, 56 .. 95, 96, 97, 98, 99, 100]
    Synchronized change commits.
    Healing partition between n4 and n5 ('ix0', 'ix1')!
    Master 192.168.140.1 belongs to n1.
    Checking for survivors.
    50 survivor VLANs on the master.
    Checking configuration consistency for n4 vs n5.
    n4: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    n5: [51, 52, 53, 54, 55, 56 .. 95, 96, 97, 98, 99, 100]
    n4 and n5 are inconsistent!
    The cluster is SPLIT BRAIN: 50 inconsistent configuration nodes. (╯°□°）╯︵ ┻━┻
    Sending traffic from 4/0/2 to 5/0/2.
    pkt_gen helper ('4/0/2', 'ix2'): Sent 1000000 packets
    pkt_gen helper ('5/0/2', 'ix3'): Timeout after 60 seconds.  Received 0 packets

The good news is that the forwarding plane is enabled on both sides of the partition, so if your VLANs are localized to a specific side of the fabric, then availability is maintained.  If the packets cross the network partition boundary though, availability can be impacted.  This makes sense as both sides of the split thought a configuration merge was unnecessary, resulting in a 'split brain' configuration.

All of this makes me wonder if the "trivial merge" strategy implemented by Brocade works at all.  If we create a single-node partition, that should clearly work, right?  We adjust the topology so that n7 and n8 are bridged through the apparatus and retry our original test:

    Cluster has been formed, topology:
       master: 192.168.140.1
       n1: 127.1.0.1
         |-- n2: 127.1.0.2
         |-- n3: 127.1.0.3
         |-- n4: 127.1.0.4
         |-- n5: 127.1.0.5
         |-- n6: 127.1.0.6
         `-- n7: 127.1.0.7
               `-- n8: 127.1.0.8
    Severing link between n7 and n8 ('ix0', 'ix1')!
    side 1 master: 192.168.140.1 pings!
    side 2 master: 192.168.140.1 pings!
    Inserting 50 VLAN definitions on side 1 and side 2:
    side 1: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    side 2: [51, 52, 53, 54, 55, 56 .. 95, 96, 97, 98, 99, 100]
    Synchronized change commits.
    Healing partition between n7 and n8 ('ix0', 'ix1')!
    Master 192.168.140.1 belongs to n1.
    Checking for survivors.
    50 survivor VLANs on the master.
    Checking configuration consistency for n7 vs n8.
    n7: [1, 2, 3, 4, 5, 6 .. 45, 46, 47, 48, 49, 50]
    n8: [1, 2, 3, 4, 5, 6 .. 95, 96, 97, 98, 99, 100]
    n7 and n8 are inconsistent!
    50 lost deletes found, cluster is INCONSISTENT.  :(

Guess not.

What can we do to mitigate this situation?  As a user, we should test to make sure the fabric is whole before applying configuration changes (`show vcs` and verify all nodes are present).  That way we don't have our data eaten by a "trivial merge" later.

I wish I could have expected better from the VDX, but they were a source of major pain for me when I had to deal with them previously... my suggestion ultimately is not to buy this product, I would wait for the second fabric product from Brocade instead.
