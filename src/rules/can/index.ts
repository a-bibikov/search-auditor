/**
 * Canonical (CAN): does every page name its main address, so search engines rank that one and not a copy.
 * A canonical on every page, one per page and in <head>, an absolute address on this site that answers 200,
 * the same in the HTML and the HTTP header, without chains, ignoring UTM parameters, and never across languages.
 */
import type { SeoRule } from "../util.ts";
import { can1 } from "./can-1.ts";
import { can2 } from "./can-2.ts";
import { can3 } from "./can-3.ts";
import { can4 } from "./can-4.ts";
import { can5 } from "./can-5.ts";
import { can6 } from "./can-6.ts";
import { can7 } from "./can-7.ts";
import { can8 } from "./can-8.ts";
import { can9 } from "./can-9.ts";

export const canRules: SeoRule[] = [can1, can2, can3, can4, can5, can6, can7, can8, can9];
