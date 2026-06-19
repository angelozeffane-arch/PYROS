#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────
const esc = s => (s||'').replace(/'/g,'’');   // apostrophes safe in JS strings
const q   = s => "'" + esc(s) + "'";

// ── category → fam mapping ────────────────────────────────────────────────────
function catToFam(cat) {
  if (/champignon|umami/i.test(cat)) return 'umami';
  if (/sel.*fum|fum.*sel/i.test(cat)) return 'sel';
  if (/herbe|plante arom/i.test(cat)) return 'herbe';
  if (/aromate/i.test(cat)) return 'aromate';
  if (/mélange|rub|frotter/i.test(cat)) return 'melange';
  if (/graine/i.test(cat)) return 'graine';
  if (/rare|exotique|méconnu/i.test(cat)) return 'rare';
  return 'epice';
}

// ── clean display name ────────────────────────────────────────────────────────
function cleanName(raw) {
  return raw.replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim();
}

// ── infer basic data from name/fam ────────────────────────────────────────────
function inferEntry(name, fam, cat) {
  const n = name.toLowerCase();
  let gout='', usage='', exemple='', origine='', intensite='', forme='', conservation='', notes='', composition='', region='', rehydratation='', umami='', salinite='', fumaison='';

  // Herbes
  if (fam==='herbe') {
    forme = 'Feuilles fraîches ou séchées';
    conservation = 'Fraîches au frigo (3-5 j), séchées en bocal (1 an)';
    if (/basilic/i.test(n))      { gout='Frais, anisé-poivré'; usage='Méditerranée, tomate, pesto'; exemple='Pistou: basilic, ail, huile'; origine='Inde, Méditerranée'; }
    else if (/persil/i.test(n))  { gout='Vert, frais, herbacé'; usage='Finitions, persillade, gremolata'; exemple='Persillade ail-persil'; origine='Europe'; }
    else if (/ciboulette/i.test(n)){ gout='Oignon doux, frais'; usage='Œufs, fromages, sauces'; exemple='Omelette à la ciboulette'; origine='Europe'; }
    else if (/coriandre/i.test(n)){ gout='Frais, agrume (variable selon génétique)'; usage='Asie, Mexique, Moyen-Orient'; exemple='Guacamole coriandre-citron vert'; origine='Méditerranée orientale'; }
    else if (/aneth/i.test(n))   { gout='Anisé frais, herbacé'; usage='Poisson, marinades, tzatziki'; exemple='Gravlax saumon aneth'; origine='Europe du Nord'; }
    else if (/estragon/i.test(n)){ gout='Anisé puissant, légèrement amer'; usage='Poulet, béarnaise, sauces'; exemple='Sauce béarnaise'; origine='Russie centrale'; }
    else if (/cerfeuil/i.test(n)){ gout='Délicat, anisé, frais'; usage='Finitions, soupes, fines herbes'; exemple='Velouté petits pois-cerfeuil'; origine='Europe'; }
    else if (/menthe/i.test(n))  { gout='Fraîche, mentholée'; usage='Taboulé, thé, desserts, sauces'; exemple='Taboulé libanais menthe-persil'; origine='Méditerranée'; }
    else if (/thym/i.test(n))    { gout='Aromatique, chaud, légèrement camphré'; usage='Rôtis, mijotés, bouquets garnis'; exemple='Gigot d’agneau thym-ail'; origine='Méditerranée'; }
    else if (/romarin/i.test(n)) { gout='Résineux, puissant, camphré'; usage='Agneau, pommes de terre, marinades'; exemple='Carré d’agneau romarin-ail'; origine='Méditerranée'; }
    else if (/sauge/i.test(n))   { gout='Camphrée, terreuse, légèrement amère'; usage='Porc, beurre noisette, gnocchis'; exemple='Beurre de sauge sur gnocchis'; origine='Méditerranée'; }
    else if (/laurier/i.test(n)) { gout='Aromatique, légèrement amer'; usage='Mijotés, fonds, marinades'; exemple='Bouquet garni pot-au-feu'; origine='Méditerranée'; }
    else if (/origan|marjolaine/i.test(n)){ gout='Chaud, méditerranéen, herbacé'; usage='Pizza, tomates, légumes grillés'; exemple='Sauce tomate sicilienne'; origine='Méditerranée'; }
    else if (/mélisse/i.test(n)) { gout='Citronnée, douce'; usage='Infusions, desserts, poisson'; exemple='Sorbet citron-mélisse'; origine='Europe du Sud'; }
    else if (/livèche|céleri perpétuel/i.test(n)){ gout='Céleri intense, puissant'; usage='Bouillons, potages, farces'; exemple='Consommé à la livèche'; origine='Europe méridionale'; }
    else if (/hysope/i.test(n))  { gout='Amère, mentholée, florale'; usage='Soupes, viandes, liqueurs'; exemple='Gigot d’agneau à l’hysope'; origine='Méditerranée'; }
    else if (/sarriette/i.test(n)){ gout='Poivrée, thym-romarin'; usage='Légumineuses, grillades, charcuterie'; exemple='Haricots verts à la sarriette'; origine='Méditerranée'; }
    else if (/verveine/i.test(n)){ gout='Citronnée, florale'; usage='Infusions, desserts, poisson'; exemple='Tarte citron verveine'; origine='Amérique du Sud'; }
    else if (/mélilot/i.test(n)) { gout='Coumarine, vanille-foin'; usage='Fromages, charcuterie, bière'; exemple='Schabziger au mélilot'; origine='Europe'; }
    else if (/bourrache/i.test(n)){ gout='Concombre frais'; usage='Salades, cocktails, sauces'; exemple='Salade avec fleurs de bourrache'; origine='Méditerranée'; }
    else if (/rue/i.test(n))     { gout='Très amer, âcre'; usage='Très petites doses, grappa'; exemple='Digestif traditionnel'; origine='Méditerranée'; }
    else { gout='Aromatique, herbacé'; usage='Finitions, infusions, cuisine'; exemple='En finition sur un plat chaud'; }
  }
  // Aromates
  else if (fam==='aromate') {
    if (/ail/i.test(n) && !/sauvage|ours/i.test(n)) { gout='Piquant, soufré, intense'; usage='Base de cuisine mondiale'; exemple='Aïoli, persillade, rôti'; origine='Asie centrale'; forme='Bulbe frais, séché, poudre'; }
    else if (/ail.*(sauvage|ours|des bois)/i.test(n)){ gout='Ail délicat, herbal'; usage='Finitions printanières, pesto'; exemple='Pesto d’ail des ours'; origine='Europe'; forme='Feuilles fraîches'; }
    else if (/oignon/i.test(n))  { gout='Sucré-âcre cru, sucré cuit'; usage='Base de sauce, soupe, rôti'; exemple='Soupe à l’oignon gratinée'; origine='Asie centrale'; forme='Bulbe frais, poudre, flocons'; }
    else if (/échalote/i.test(n)){ gout='Oignon doux, subtil'; usage='Sauces raffinées, vinaigrettes'; exemple='Sauce bordelaise à l’échalote'; origine='Asie centrale'; forme='Bulbe frais'; }
    else if (/poireau/i.test(n)) { gout='Doux, sucré, fond de pot'; usage='Veloutés, quiches, beurre blanc'; exemple='Vichyssoise poireau-pomme de terre'; origine='Méditerranée'; forme='Légume frais'; }
    else if (/gingembre/i.test(n)){ gout='Piquant frais, citronné, chaud'; usage='Universel sucré-salé, tisanes'; exemple='Marinade soja-gingembre'; origine='Asie du Sud-Est'; forme='Rhizome frais ou en poudre'; }
    else if (/curcuma/i.test(n)) { gout='Terreux, amer, légèrement poivré'; usage='Currys, couleur dorée, smoothies'; exemple='Riz jaune au curcuma'; origine='Asie du Sud'; forme='Rhizome frais ou en poudre'; }
    else if (/galanga/i.test(n)) { gout='Pin-agrume, piquant, camphré'; usage='Pâtes de curry, soupes asiatiques'; exemple='Tom kha gai (soupe lait coco)'; origine='Asie du Sud-Est'; forme='Rhizome frais ou séché'; }
    else if (/raifort/i.test(n)) { gout='Très piquant, lacrymal'; usage='Condiment, viandes, saumon'; exemple='Crème de raifort avec rosbif'; origine='Europe de l’Est'; forme='Racine fraîche, condiment'; }
    else if (/wasabi/i.test(n))  { gout='Piquant intense, nasal, wasabi'; usage='Sushis, sashimis, sauces'; exemple='Sushi nigiri avec wasabi'; origine='Japon'; forme='Pâte ou en poudre'; }
    else if (/citronnel/i.test(n)){ gout='Citronnée, florale, légère'; usage='Soupes asiatiques, marinades, thé'; exemple='Tom yum galanga-citronnelle'; origine='Asie du Sud-Est'; forme='Tiges fraîches, séchées, poudre'; }
    else if (/zeste.*citron|citron.*zeste/i.test(n)){ gout='Acidulé, frais, aromatique'; usage='Pâtisserie, poisson, finitions'; exemple='Risotto citron-parmesan'; origine='Asie (introduit Méditerranée)'; forme='Zeste frais'; }
    else { gout='Aromatique, végétal'; usage='Bases de cuisine, marinades'; exemple='En base de sofrito'; forme='Frais ou séché'; }
    conservation = 'Frais au frigo (1-2 sem), séché en bocal hermétique';
  }
  // Épices individuelles
  else if (fam==='epice') {
    forme = 'Entières ou moulues';
    conservation = 'Bocal hermétique à l’abri de la lumière (1-2 ans)';
    if (/poivre.*noir/i.test(n)) { gout='Piquant, chaud, boisé'; usage='Universel'; exemple='Steak au poivre mignonette'; origine='Côte de Malabar, Inde'; intensite='Moyen-Fort'; }
    else if (/poivre.*blanc/i.test(n)){ gout='Piquant fin, plus subtil que noir'; usage='Sauces blanches, poissons'; exemple='Sauce suprême au poivre blanc'; origine='Asie du Sud-Est, Inde'; intensite='Moyen'; }
    else if (/poivre.*vert/i.test(n)){ gout='Frais, vif, herbacé'; usage='Sauces crème, canard'; exemple='Steak poivre vert en grains'; origine='Inde, Madagascar'; intensite='Moyen'; }
    else if (/poivre.*rose|baies.*roses/i.test(n)){ gout='Doux, résineux, légèrement fruité'; usage='Poisson, déco, sauces légères'; exemple='Saumon mariné baies roses'; origine='Amérique du Sud'; intensite='Doux'; }
    else if (/poivre.*sichuan/i.test(n)){ gout='Citronné, anesthésiant (málà)'; usage='Cuisine sichuanaise, huile pimentée'; exemple='Huile de piment au Sichuan'; origine='Chine'; intensite='Fort (engordissant)'; }
    else if (/poivre.*timut/i.test(n)){ gout='Pamplemousse, floral, fruité'; usage='Poissons, desserts, crus'; exemple='Crème chocolat blanc-Timut'; origine='Népal, Himalaya'; intensite='Moyen'; }
    else if (/poivre.*long/i.test(n)){ gout='Chaud, sucré-boisé, épicé'; usage='Mijotés, desserts, fromages'; exemple='Râpé sur chocolat chaud'; origine='Inde, Népal'; intensite='Moyen-Fort'; }
    else if (/poivre/i.test(n))  { gout='Piquant, aromatique'; usage='Assaisonnement, finitions'; exemple='Sur viandes et poissons'; origine='Asie, Afrique'; intensite='Variable'; }
    else if (/cannelle.*ceylan/i.test(n)){ gout='Douce, fine, légèrement sucrée'; usage='Pâtisserie, tajines, boissons'; exemple='Riz au lait cannelle'; origine='Sri Lanka'; intensite='Doux'; forme='Écorce, bâtons, poudre'; }
    else if (/cannelle|casse/i.test(n)){ gout='Chaude, épicée, parfois âcre'; usage='Pâtisserie, vins chauds, currys'; exemple='Pain d’épices'; origine='Asie'; intensite='Moyen'; forme='Bâtons, poudre'; }
    else if (/cardamome.*verte/i.test(n)){ gout='Camphrée, citronnée, eucalyptus'; usage='Café, currys, brioches, desserts'; exemple='Kahwa (thé épicé kashmiri)'; origine='Inde du Sud, Guatemala'; intensite='Fort'; forme='Capsules, graines, poudre'; }
    else if (/cardamome.*noire/i.test(n)){ gout='Fumée, camphrée, terreuse'; usage='Biryani, bouillons épicés'; exemple='Biryani cardamome noire'; origine='Népal, Inde du Nord'; intensite='Fort'; forme='Capsules entières'; }
    else if (/cardamome/i.test(n)){ gout='Aromatique, camphrée, sucrée'; usage='Épices, boissons, desserts'; exemple='Thé cardamome'; origine='Asie'; intensite='Moyen-Fort'; forme='Capsules ou poudre'; }
    else if (/clou.*girofle|girofle/i.test(n)){ gout='Puissant, médicinal, eugénol'; usage='Vins chauds, mijotés, oignon clouté'; exemple='Oignon clouté pour sauce'; origine='Îles Moluques, Indonésie'; intensite='Très fort'; forme='Entiers ou moulus'; }
    else if (/muscade/i.test(n)) { gout='Chaud, boisé, légèrement sucré'; usage='Béchamel, gratins, pomme de terre'; exemple='Gratin dauphinois muscade'; origine='Indonésie, Grenade'; intensite='Moyen'; forme='Noix entière, râpée, poudre'; }
    else if (/macis/i.test(n))   { gout='Cannelle-muscade, plus délicat'; usage='Charcuterie, pâtisserie fine'; exemple='Farce de saucisson'; origine='Indonésie'; intensite='Moyen'; forme='Fleur séchée'; }
    else if (/anis.*étoilé|badiane/i.test(n)){ gout='Anisé puissant, doux-chaud'; usage='Bouillons pho, alcools, vin chaud'; exemple='Bouillon pho à la badiane'; origine='Chine du Sud'; intensite='Fort'; forme='Étoiles entières ou poudre'; }
    else if (/cumin.*noir|nigelle/i.test(n)){ gout='Poivré, oignon, légèrement fumé'; exemple='Pain naan à la nigelle'; usage='Pain, fromage, currys'; origine='Moyen-Orient, Asie du Sud'; intensite='Moyen'; }
    else if (/cumin/i.test(n))   { gout='Chaud, terreux, légèrement amer'; usage='Orient, Mexique, Inde'; exemple='Carottes rôties au cumin'; origine='Méditerranée orientale, Asie'; intensite='Moyen'; }
    else if (/carvi/i.test(n))   { gout='Anisé-cumin, légèrement citronné'; usage='Choucroute, fromages, pain'; exemple='Pain de seigle au carvi'; origine='Europe'; intensite='Moyen'; }
    else if (/fenouil.*grain/i.test(n)){ gout='Anisé doux, légèrement sucré'; usage='Charcuterie, poissons, pain'; exemple='Saucisse italienne au fenouil'; origine='Méditerranée'; intensite='Doux-Moyen'; }
    else if (/anis.*vert.*grain|anis.*grain/i.test(n)){ gout='Anisé sucré, doux'; usage='Pâtisserie, liqueurs, infusions'; exemple='Pain d’anis de Flavigny'; origine='Méditerranée'; intensite='Doux'; }
    else if (/fenugrec/i.test(n)){ gout='Amer, érable-curry, légèrement caramel'; usage='Currys, panification, currys méthi'; exemple='Dal méthi au fenugrec'; origine='Inde, Méditerranée'; intensite='Moyen'; }
    else if (/curcuma/i.test(n)) { gout='Terreux, amer, légèrement poivré, jaune vif'; usage='Currys, coloration, anti-inflammatoire'; exemple='Riz jaune au curcuma'; origine='Asie du Sud'; intensite='Doux-Moyen'; }
    else if (/safran/i.test(n))  { gout='Floral, miel-médicinal, colorant intense'; usage='Paella, risotto, bouillabaisse'; exemple='Risotto alla Milanese'; origine='Iran, Espagne'; intensite='Puissant (en petite quantité)'; }
    else if (/paprika.*fumé|pimentón/i.test(n)){ gout='Fumé profond, doux ou fort'; usage='Chorizo, patatas bravas, marinades'; exemple='Patatas bravas au pimentón'; origine='Espagne'; intensite='Variable'; }
    else if (/paprika/i.test(n)) { gout='Fruité, doux, coloré'; usage='Couleur et rondeur, goulash'; exemple='Goulash hongroise'; origine='Hongrie, Espagne'; intensite='Doux-Moyen'; }
    else if (/piment.*cayenne/i.test(n)){ gout='Piquant pur, neutre en arôme'; usage='Releveur universel'; exemple='Quelques grains dans une sauce'; origine='Amérique du Sud'; intensite='Fort'; }
    else if (/piment/i.test(n))  { gout='Piquant, parfois fruité ou fumé'; usage='Sauces, marinades, cuisine relevée'; exemple='Sauce piment maison'; origine='Amérique'; intensite='Variable'; }
    else if (/coriandre.*grain/i.test(n)){ gout='Agrume, doux, légèrement floral'; usage='Marinades, pickles, currys'; exemple='À la grecque de légumes'; origine='Méditerranée orientale'; intensite='Doux'; }
    else if (/garam masala/i.test(n)){ gout='Complexe, chaud, épicé-sucré'; usage='Finition de currys, riz, viandes'; exemple='Murgh makhani (poulet beurre)'; origine='Inde du Nord'; intensite='Moyen'; forme='Poudre de mélange'; }
    else { gout='Aromatique, épicé'; usage='Assaisonnement, cuisine du monde'; exemple='En mélange d’épices ou seule'; intensite='Moyen'; }
  }
  // Champignons/Umami
  else if (fam==='umami') {
    forme = 'Séchés entiers, en poudre ou lamelles';
    conservation = 'Endroit sec, bocal hermétique (1 an)';
    if (/shiitake/i.test(n))     { gout='Umami profond, boisé, terpin'; usage='Bouillons, sautés, ramen'; exemple='Dashi shiitake-kombu'; origine='Asie de l’Est'; intensite='Puissant'; }
    else if (/porcini|cèpe/i.test(n)){ gout='Terreux, boisé, umami profond'; usage='Risotto, sauces, farces'; exemple='Risotto porcini'; origine='Europe'; intensite='Puissant'; }
    else if (/kombu/i.test(n))   { gout='Iodé, umami (glutamate naturel)'; usage='Dashi, bouillons, légumineuses'; exemple='Dashi kombu-katsuobushi'; origine='Japon'; intensite='Fort'; forme='Algue séchée'; notes='Riche en glutamate'; }
    else if (/katsuobushi|bonite/i.test(n)){ gout='Fumé, iodé, umami'; usage='Dashi, okonomiyaki, garnishes'; exemple='Dashi japonais'; origine='Japon'; intensite='Fort'; forme='Copeaux de bonite fumée'; }
    else if (/miso/i.test(n))    { gout='Salé, umami, fermenté'; usage='Soupes, marinades, sauces'; exemple='Soupe miso au tofu'; origine='Japon'; intensite='Fort'; forme='Pâte fermentée'; }
    else if (/tomate.*séch/i.test(n)){ gout='Concentré, sucré-acidulé, umami'; usage='Pizzas, sauces, pâtes'; exemple='Pâtes avec tomates séchées'; origine='Méditerranée'; intensite='Moyen-Fort'; }
    else if (/anchois/i.test(n)) { gout='Salé, umami, iodé'; usage='Pizzas, sauces, Caesar'; exemple='Pissaladière niçoise'; origine='Méditerranée'; intensite='Fort'; forme='Filets séchés ou en saumure'; }
    else if (/parmesan/i.test(n)){ gout='Umami intense, salé, noisette'; usage='Pâtes, risottos, gratins'; exemple='Pasta cacio e pepe'; origine='Italie'; intensite='Fort'; forme='Copeaux, râpé'; }
    else { gout='Umami, iodé ou terreux'; usage='Bouillons, sauces, assaisonnement'; exemple='En bouillon ou sauce umami'; }
  }
  // Mélanges
  else if (fam==='melange') {
    forme = 'Poudre de mélange';
    conservation = 'Bocal hermétique à l’abri de la lumière (6 mois - 1 an)';
    if (/ras.*hanout/i.test(n))  { gout='Complexe, chaud, floral, épicé-sucré'; usage='Tajines, couscous, viandes'; exemple='Épaule d’agneau au ras el hanout'; origine='Maroc, Afrique du Nord'; composition='20-30 épices (cannelle, cardamome, rose, cumin…)'; }
    else if (/za.atar/i.test(n)) { gout='Herbacé, acidulé (sumac), thymé'; usage='Pains, huile d’olive, poulet'; exemple='Manouché zaatar (pain libanais)'; origine='Levant'; composition='Origan/thym, sumac, sésame, sel'; }
    else if (/sumac/i.test(n))   { gout='Acidulé, fruité-citronné, tannique'; usage='Viandes grillées, salades, zaatar'; exemple='Kebab au sumac'; origine='Moyen-Orient'; forme='Poudre de baies'; }
    else if (/curry/i.test(n))   { gout='Complexe, chaud, épicé-terreux'; usage='Plats asiatiques ou créatifs'; exemple='Curry de poulet au lait de coco'; origine='Inde / Asie'; composition='Curcuma, cumin, coriandre, piment…'; }
    else if (/garam masala/i.test(n)){ gout='Chaud, épicé-sucré, complexe'; usage='Finitions de curry, viandes, légumes'; exemple='Chicken tikka masala'; origine='Inde du Nord'; composition='Cannelle, girofle, cardamome, cumin…'; }
    else if (/quatre.*épices/i.test(n)){ gout='Chaud, poivré, clou-muscade'; usage='Charcuterie, pâtés, viandes braisées'; exemple='Terrine de campagne'; origine='France'; composition='Poivre, girofle, muscade, cannelle ou gingembre'; }
    else if (/herbes.*provence|provençal/i.test(n)){ gout='Herbacé, floral, soleil'; usage='Grillades, pizzas, légumes'; exemple='Poulet fermier herbes de Provence'; origine='Provence, France'; composition='Thym, romarin, origan, lavande…'; }
    else if (/bouquet garni/i.test(n)){ gout='Aromatique, fonds'; usage='Mijotés, bouillons, pot-au-feu'; exemple='Fond brun avec bouquet garni'; origine='France'; composition='Thym, laurier, persil'; }
    else if (/five.*spice|cinq.*épices/i.test(n)){ gout='Anisé, chaud, équilibré'; usage='Canard laqué, viandes confites'; exemple='Canard laqué cinq épices'; origine='Chine'; composition='Anis étoilé, Sichuan, cannelle, fenouil, girofle'; }
    else if (/harissa/i.test(n)) { gout='Piquant, fumé, pimenté'; usage='Couscous, grillades, sauces'; exemple='Merguez-harissa'; origine='Tunisie'; composition='Piment rouge, ail, cumin, carvi'; }
    else if (/dukkah/i.test(n))  { gout='Noisette-grillée, aromatique'; usage='Pain trempé, poulet, salade'; exemple='Pain naan à l’huile-dukkah'; origine='Égypte'; composition='Noisettes, sésame, coriandre, cumin'; }
    else if (/baharat/i.test(n)) { gout='Chaud, légèrement fumé, doux'; usage='Kebbé, agneau, riz pilaf'; exemple='Agneau pilaf baharat'; origine='Moyen-Orient'; composition='Poivre, cannelle, cardamome, noix muscade'; }
    else if (/chermoula/i.test(n)){ gout='Herbacé, citronné, épicé'; usage='Poisson, poulet, marinades'; exemple='Daurade marinée chermoula'; origine='Maroc'; composition='Coriandre, persil, ail, cumin, citron'; }
    else if (/tandoori/i.test(n)){ gout='Chaud, rouge, aromatique'; usage='Poulet tandoori, marinades'; exemple='Poulet tandoori au yaourt'; origine='Inde du Nord'; composition='Cumin, coriandre, paprika, garam masala'; }
    else if (/tikka/i.test(n))   { gout='Légèrement piquant, citronné, épicé'; usage='Marinades poulet, légumes'; exemple='Chicken tikka masala'; origine='Inde'; composition='Cumin, coriandre, piment, gingembre'; }
    else if (/berbere/i.test(n)) { gout='Puissant, piquant, aromatique'; usage='Injera, ragoûts éthiopiens, viandes'; exemple='Doro wat (poulet éthiopien)'; origine='Éthiopie, Érythrée'; composition='Piment, fenugrec, coriandre, korarima'; }
    else if (/cajun/i.test(n))   { gout='Piquant, fumé, paprika, herbacé'; usage='Poulet, poissons, barbecue'; exemple='Chicken cajun grillé'; origine='Louisiane, USA'; composition='Paprika, cayenne, origan, thym, ail'; }
    else if (/jerk/i.test(n))    { gout='Piquant, sucré, épicé-fumé'; usage='Poulet, porc, barbecue'; exemple='Jerk chicken jamaïcain'; origine='Jamaïque'; composition='Piment de la Jamaïque, scotch bonnet, thym, ail'; }
    else if (/mole/i.test(n))    { gout='Complexe, chocolat-piment, profond'; usage='Dinde, poulet, enchiladas'; exemple='Mole negro mexicain'; origine='Mexique (Oaxaca, Puebla)'; composition='Piment, chocolat, cannelle, tomate, ail'; }
    else if (/furikake/i.test(n)){ gout='Umami, iodé, sésame, légèrement sucré'; usage='Riz, onigiri, soupe'; exemple='Riz furikake'; origine='Japon'; composition='Algues nori, sésame, bonite, sel, sucre'; }
    else if (/shichimi/i.test(n)){ gout='Piquant, citronné, herbacé (7 saveurs)'; usage='Ramen, soba, yakitori'; exemple='Ramen shichimi'; origine='Japon'; composition='Piment, Sichuan, yuzu, nori, gingembre, sésame'; }
    else if (/chili.*powder|chili.*epice/i.test(n)){ gout='Piquant-terreux, paprika, cumin'; usage='Chili con carne, tex-mex'; exemple='Chili con carne'; origine='USA, Mexique'; composition='Piment, cumin, ail, origan'; }
    else { gout='Complexe, aromatique'; usage='Plats du monde, marinades, rôtis'; exemple='En assaisonnement ou marinade'; }
  }
  // Sels
  else if (fam==='sel') {
    forme = 'Cristaux fins, fleur de sel, fumée';
    conservation = 'Bocal hermétique, hors humidité (indéfini)';
    if (/fleur.*sel/i.test(n))   { gout='Sel pur, iodé délicat, cristallin'; usage='Finitions, chocolat, viandes'; exemple='Caramel beurre salé'; origine='Guérande, Camargue'; salinite='Normale'; }
    else if (/sel.*himalaya|himalaya/i.test(n)){ gout='Salé minéral, doux, rose'; usage='Présentation, finitions, assaisonnement'; exemple='Sur un tartare ou burrata'; origine='Pakistan (Khewra)'; salinite='Normale'; }
    else if (/fleur.*sel.*guerande|guérande/i.test(n)){ gout='Iodé, marin, floral délicat'; usage='Finition reine de la cuisine française'; exemple='Chocolat noir fleur de sel'; origine='Guérande, France'; salinite='Normale'; }
    else if (/sel.*fumé|fumé/i.test(n)){ gout='Fumé, boisé, salé'; usage='Grillades, viandes, œufs'; exemple='Œufs au plat sel fumé'; origine='Variable (hêtre, chêne, pommier)'; salinite='Normale'; fumaison='Hêtre, chêne ou pommier'; }
    else if (/kala namak/i.test(n)){ gout='Soufré (œuf), salé, minéral'; usage='Chaat indien, cuisine végane'; exemple='Tofu brouillé façon œufs'; origine='Inde, Pakistan'; salinite='Normale'; }
    else if (/sel.*celeri/i.test(n)){ gout='Salé, céleri, végétal'; usage='Cocktails, sauces blanches'; exemple='Bloody Mary au sel de céleri'; origine='France, USA'; }
    else { gout='Salé, minéral'; usage='Assaisonnement, finitions, conservation'; exemple='En finition sur les plats'; salinite='Variable'; }
  }
  // Graines aromatiques
  else if (fam==='graine') {
    forme = 'Graines entières ou légèrement grillées';
    conservation = 'Bocal hermétique (2 ans)';
    if (/sésame/i.test(n))       { gout='Noisette, légèrement grillé'; usage='Pain, sushis, houmous, tahini'; exemple='Tahini (pâte sésame)'; origine='Afrique, Inde'; intensite='Doux'; }
    else if (/pavot/i.test(n))   { gout='Noisette douce, neutre'; usage='Pain, viennoiseries, fromages'; exemple='Bagels aux graines de pavot'; origine='Méditerranée, Asie'; intensite='Doux'; }
    else if (/moutarde.*grain/i.test(n)){ gout='Piquant doux cru, piquant libéré à l’humidité'; usage='Pickles, charcuterie, sauces'; exemple='Lapin à la moutarde'; origine='Méditerranée'; intensite='Moyen'; }
    else if (/lin/i.test(n))     { gout='Légèrement noisette, mucilagineuse'; usage='Pain, smoothies, nutrition'; exemple='Pain aux graines de lin'; origine='Proche-Orient'; intensite='Doux'; }
    else if (/tournesol/i.test(n)){ gout='Noisette légère, grasse'; usage='Pain, salade, beurres'; exemple='Salade niçoise aux tournesol'; origine='Amériques'; intensite='Doux'; }
    else if (/chanvre/i.test(n)) { gout='Noisette douce, végétale'; usage='Smoothies, salades, superaliments'; exemple='Bowl avec graines de chanvre'; origine='Asie centrale'; intensite='Doux'; }
    else if (/chia/i.test(n))    { gout='Neutre, gélifiant'; usage='Pudding, smoothie, boulangerie'; exemple='Pudding chia lait de coco'; origine='Mexique, Amérique centrale'; intensite='Neutre'; }
    else if (/potiron.*graine|citrouille.*graine/i.test(n)){ gout='Noisette légère, légèrement salée'; usage='Soupe, salade, granola'; exemple='Velouté potiron-graines'; origine='Amériques'; intensite='Doux'; }
    else if (/grenade.*graine|anardana/i.test(n)){ gout='Aigre-doux (grenade séchée)'; usage='Chutneys, currys nord-indiens'; exemple='Chaat à l’anardana'; origine='Inde du Nord'; intensite='Moyen'; }
    else { gout='Noisette, aromatique, légèrement grillée'; usage='Pain, pâtisserie, cuisines du monde'; exemple='En finition ou en mélanges de graines'; }
  }
  // Rares/exotiques
  else if (fam==='rare') {
    forme = 'Variable';
    conservation = 'Bocal hermétique à l’abri lumière et chaleur';
    if (/graines.*paradis|maniguette/i.test(n)){ gout='Piquant, poivré, gingembre-cardamome'; usage='Cuisine africaine, vin chaud, fromages'; exemple='Hypothèse de poivre médiéval'; origine='Afrique de l’Ouest'; intensite='Fort'; }
    else if (/poivre.*voatsiperifery/i.test(n)){ gout='Sauvage, floral, agrume-boisé'; usage='Finitions nobles, poissons'; exemple='Saint-Jacques snackée Voatsiperifery'; origine='Madagascar'; intensite='Moyen-Fort'; }
    else if (/poivre.*cubèbe/i.test(n)){ gout='Poivré, camphré, eucalyptus'; usage='Cuisine médiévale, cocktails, bouillons'; exemple='Pigment du ras el hanout'; origine='Java, Indonésie'; intensite='Fort'; }
    else if (/amchur/i.test(n))  { gout='Aigre, fruité (mangue verte séchée)'; usage='Chutneys, chaats, marinades'; exemple='Chaat masala avec amchur'; origine='Inde'; intensite='Acide'; forme='Poudre de mangue verte'; }
    else if (/asafœtida|asafoetida|hing/i.test(n)){ gout='Soufré fort (ail-oignon cuit), se fond à la cuisson'; usage='Currys végétariens, dal'; exemple='Dal jeera à l’hing'; origine='Iran, Afghanistan'; intensite='Très fort (petites doses)'; forme='Gomme résine, poudre'; }
    else if (/ajwain/i.test(n))  { gout='Thym-cumin, piquant, intense'; usage='Pains indiens, légumineuses'; exemple='Paratha ajwain'; origine='Inde, Égypte'; intensite='Fort'; }
    else if (/épazote/i.test(n)) { gout='Herbacé, savon, pétroleum, médicinal'; usage='Haricots noirs, mole, tacos'; exemple='Soupe de haricots à l’épazote'; origine='Mexique, Amérique centrale'; intensite='Fort'; }
    else if (/mastic/i.test(n))  { gout='Résineux, pin-citronné'; usage='Loukoums, glace, pain grec'; exemple='Glace mastique grecque'; origine='Grèce (Chios)'; intensite='Moyen'; forme='Larmes de résine'; }
    else if (/tonka/i.test(n))   { gout='Vanille-amande-cannelle, coumarine'; usage='Desserts fins, chocolat'; exemple='Crème brûlée fève tonka'; origine='Amazonie'; intensite='Moyen'; forme='Fève entière (râper)'; notes='Coumarine: interdit en grandes doses'; }
    else if (/vanille/i.test(n)) { gout='Vanillée, sucrée, florale, chaude'; usage='Pâtisserie, crèmes, chocolat'; exemple='Crème caramel à la vanille'; origine='Mexique, Madagascar'; intensite='Doux'; forme='Gousses, poudre, extrait'; }
    else if (/safran/i.test(n))  { gout='Floral, miel, légèrement médicinal'; usage='Paella, risotto, bouillabaisse'; exemple='Risotto milanais'; origine='Iran, Espagne'; intensite='Puissant (micro-doses)'; forme='Pistils ou poudre'; }
    else { gout='Rare et distinctif, arôme unique'; usage='Spécialités régionales, cuisine gastronomique'; exemple='En finition ou ingrédient signature'; }
  }
  // Default
  else {
    gout='Aromatique';
    usage='Cuisine, assaisonnement';
    exemple='En épice ou en mélange';
  }

  return { gout, usage, exemple, origine, intensite, forme, conservation, notes, composition, region, rehydratation, umami, salinite, fumaison };
}

// ── DETAIL lookup table from existing data ────────────────────────────────────
// These are the well-known entries already in EPICE_DETAIL; we keep them verbatim
const DETAIL_LOOKUP = {
  // key: normalized name, value: detail fields
};

// ── FAM mapping ───────────────────────────────────────────────────────────────
const FAM_CATEGORIES = [
  {pattern:/champignon|umami/i, fam:'umami'},
  {pattern:/sel.*fum|fum.*sel|sel &|^sel$/i, fam:'sel'},
  {pattern:/herbe|plante arom/i, fam:'herbe'},
  {pattern:/aromate/i, fam:'aromate'},
  {pattern:/mélange|melange|rub|frotter|pâtisserie|boulangerie|fusion|tendance/i, fam:'melange'},
  {pattern:/graine/i, fam:'graine'},
  {pattern:/rare|exotique|méconnu/i, fam:'rare'},
  {pattern:/épice|asie|moyen.orient|afrique|amérique/i, fam:'epice'},
];

function getFam(catName) {
  for (const {pattern, fam} of FAM_CATEGORIES) {
    if (pattern.test(catName)) return fam;
  }
  return 'epice';
}

// ── normalize for key ─────────────────────────────────────────────────────────
function normKey(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
}

// ── main ──────────────────────────────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync('/root/.claude/uploads/080eb5d8-d420-575e-851e-8e8702ecef6d/ad12be61-epices_liste.json','utf8'));

const seen = new Map(); // normKey → entry
data.categories.forEach(cat => {
  const fam = getFam(cat.categorie);
  cat.items.forEach(raw => {
    const nom = cleanName(raw);
    const key = normKey(nom);
    if (!seen.has(key)) {
      const inf = inferEntry(nom, fam, cat.categorie);
      seen.set(key, { nom, fam, ...inf, _cat: cat.categorie });
    }
  });
});

console.log('Unique entries:', seen.size);

// ── generate EPICE_FAM block ──────────────────────────────────────────────────
const FAM_BLOCK = `var EPICE_FAM=[['epice','Épice'],['herbe','Herbe'],['aromate','Aromate'],['melange','Mélange'],['umami','Champignon/umami'],['sel','Sel & fumée'],['graine','Graine'],['rare','Rare / méconnu']];`;

// ── generate EPICE_REF block ──────────────────────────────────────────────────
const entries = Array.from(seen.values());

function fld(k, v) {
  if (!v) return '';
  return k + ':' + q(v) + ',';
}

const lines = entries.map(e => {
  const parts = [
    `nom:${q(e.nom)}`,
    `fam:${q(e.fam)}`,
    e.origine    ? `origine:${q(e.origine)}` : '',
    e.gout       ? `gout:${q(e.gout)}` : '',
    e.intensite  ? `intensite:${q(e.intensite)}` : '',
    e.forme      ? `forme:${q(e.forme)}` : '',
    e.usage      ? `usage:${q(e.usage)}` : '',
    e.exemple    ? `exemple:${q(e.exemple)}` : '',
    e.conservation ? `conservation:${q(e.conservation)}` : '',
    e.notes      ? `notes:${q(e.notes)}` : '',
    e.composition ? `composition:${q(e.composition)}` : '',
    e.region     ? `region:${q(e.region)}` : '',
    e.rehydratation ? `rehydratation:${q(e.rehydratation)}` : '',
    e.umami      ? `umami:${q(e.umami)}` : '',
    e.salinite   ? `salinite:${q(e.salinite)}` : '',
    e.fumaison   ? `fumaison:${q(e.fumaison)}` : '',
  ].filter(Boolean).join(',');
  return ` {${parts}}`;
});

const REF_BLOCK = `var EPICE_REF=[\n${lines.join(',\n')}\n];`;

// ── empty EPICE_DETAIL (fields now inline in REF) ─────────────────────────────
const DETAIL_BLOCK = `var EPICE_DETAIL={};`;

const NEW_BLOCK = FAM_BLOCK + '\n' + REF_BLOCK + '\n' + DETAIL_BLOCK;

// ── patch index.html ──────────────────────────────────────────────────────────
const htmlPath = '/home/user/PYROS/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Find anchors
const startAnchor = "var EPICE_FAM=[['epice',";
const endAnchor   = "function _refNorm(s){";

const startIdx = html.indexOf(startAnchor);
const endIdx   = html.indexOf(endAnchor);

if (startIdx === -1) { console.error('START ANCHOR NOT FOUND'); process.exit(1); }
if (endIdx   === -1) { console.error('END ANCHOR NOT FOUND');   process.exit(1); }

console.log(`Replacing chars ${startIdx}..${endIdx} (${endIdx-startIdx} chars, ~${Math.round((endIdx-startIdx)/1024)}KB)`);

const newHtml = html.slice(0, startIdx) + NEW_BLOCK + '\n' + html.slice(endIdx);

// ── validate JS ──────────────────────────────────────────────────────────────
const scriptStart = newHtml.indexOf('<script>');
const scriptEnd   = newHtml.lastIndexOf('</script>');
if (scriptStart !== -1 && scriptEnd !== -1) {
  const js = newHtml.slice(scriptStart + 8, scriptEnd);
  try {
    new Function(js);
    console.log('JS validation: OK');
  } catch(e) {
    console.error('JS VALIDATION FAILED:', e.message);
    process.exit(1);
  }
} else {
  console.warn('Could not locate <script> for validation');
}

fs.writeFileSync(htmlPath, newHtml);
const finalSize = Math.round(newHtml.length / 1024);
console.log(`Written. File size: ${finalSize} KB`);

// Count entries
const count = (newHtml.match(/\{nom:'/g)||[]).length;
console.log(`EPICE_REF entries in file: ${count}`);
