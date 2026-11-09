/**
 * Images (IMG): can image search and screen readers tell what an image shows, and do images keep the page fast.
 * Alt text on every image that describes it, width and height so the layout does not jump, lazy loading below the
 * first screen but not for the first image, modern formats, images that open, and none heavier than it needs to be.
 */
import type { SeoRule } from "../util.ts";
import { img1 } from "./img-1.ts";
import { img2 } from "./img-2.ts";
import { img3 } from "./img-3.ts";
import { img4 } from "./img-4.ts";
import { img5 } from "./img-5.ts";
import { img6 } from "./img-6.ts";
import { img7 } from "./img-7.ts";

export const imgRules: SeoRule[] = [img1, img2, img3, img4, img5, img6, img7];
