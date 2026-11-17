"""Convert the authoritative deck into faithful click-build frames.
Original input is read-only. LibreOffice renders a temporary expanded copy.
Entrance / exit visibility is retained; motion and transition effects become
explicit click steps. Only auto-size map labels get a render-compatibility fix.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from lxml import etree as E
from copy import deepcopy
import json, hashlib, sys

BASE=Path(__file__).resolve().parents[1]
SOURCE=BASE.parent/'11.17 seasons-1.pptx'
WORK=BASE.parent/'.work/seasons/revised-render'
WORK.mkdir(parents=True,exist_ok=True)
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
PN=NS['p']; RN=NS['r']; PR='http://schemas.openxmlformats.org/package/2006/relationships'; CT='http://schemas.openxmlformats.org/package/2006/content-types'
z=ZipFile(SOURCE); frames=[]; slide_info=[]; xref={}; maps={4,7,10,13}

def serialize(node):return E.tostring(node,xml_declaration=True,encoding='UTF-8',standalone=True)
def shape_id(shape):
 n=shape.find('.//p:cNvPr',NS)
 return n.get('id') if n is not None else None

def hide_shapes(root,hidden):
 for el in list(root.iter()):
  if el.tag in [f'{{{PN}}}{tag}' for tag in ('sp','pic','grpSp','graphicFrame','cxnSp')] and shape_id(el) in hidden:
   parent=el.getparent()
   if parent is not None:parent.remove(el)

def label_fix(root,number):
 if number not in maps:return
 for shape in root.findall('.//p:sp',NS):
  text=''.join(shape.xpath('.//a:t/text()',namespaces=NS))
  if text not in ['Winter','Spring','Summer','Autumn']:continue
  ext=shape.find('p:spPr/a:xfrm/a:ext',NS)
  if ext is not None:ext.set('cx',str(round(int(ext.get('cx'))*1.7)))

def metadata(root,number):
 result={'page':number,'frames':[],'mapHotspots':[],'videoRect':None,'videoFrom':None,'videoShape':None}
 rels=E.fromstring(z.read(f'ppt/slides/_rels/slide{number}.xml.rels'))
 targets={n.get('Id'):n.get('Target') for n in rels}
 for pic in root.findall('.//p:pic',NS):
  blip=pic.find('.//a:blip',NS);xf=pic.find('p:spPr/a:xfrm',NS)
  if blip is None or xf is None:continue
  name=Path(targets.get(blip.get(f'{{{RN}}}embed'), '')).name
  off=xf.find('a:off',NS);ext=xf.find('a:ext',NS)
  if off is None or ext is None:continue
  rect={'x':int(off.get('x'))/12192000*100,'y':int(off.get('y'))/6858000*100,'w':int(ext.get('cx'))/12192000*100,'h':int(ext.get('cy'))/6858000*100}
  mapped={'image15.png':'winter','image13.png':'spring','image14.png':'summer','image12.png':'autumn'}.get(name)
  if mapped and number in maps:result['mapHotspots'].append({'season':mapped,**rect})
  if name in ['image23.png','image27.png'] and number in [9,15]:
   result['videoRect']=rect;result['videoShape']=shape_id(pic)
 return result

for page in range(1,23):
 original=E.fromstring(z.read(f'ppt/slides/slide{page}.xml'));label_fix(original,page)
 info=metadata(original,page)
 effects=[]
 for tn in original.findall('.//p:cTn',NS):
  if tn.get('presetClass') in ['entr','exit','emph']:
   ids=list(dict.fromkeys(s.get('spid') for s in tn.findall('.//p:spTgt',NS)))
   effects.append({'type':tn.get('presetClass'),'node':tn.get('nodeType'),'ids':ids})
 hidden={i for e in effects if e['type']=='entr' for i in e['ids']}
 initial=[]; groups=[];current=None
 for effect in effects:
  if effect['node']=='clickEffect':current=[];groups.append(current)
  (initial if current is None else current).append(effect)
 def apply(events):
  for e in events:
   if e['type']=='entr':hidden.difference_update(e['ids'])
   if e['type']=='exit':hidden.update(e['ids'])
 apply(initial)
 previous=None
 for step in range(len(groups)+1):
  if step:apply(groups[step-1])
  root=deepcopy(original)
  for tag in ['timing','transition']:
   node=root.find(f'p:{tag}',NS)
   if node is not None:root.remove(node)
  hide_shapes(root,hidden)
  xml=serialize(root)
  if xml==previous:continue
  previous=xml
  index=len(frames)+1;frame_step=len(info['frames']);file=f'ppt-frames/{page:02d}-{frame_step:02d}.webp'
  if info['videoShape'] and info['videoFrom'] is None and info['videoShape'] not in hidden:info['videoFrom']=frame_step
  info['frames'].append(file)
  frames.append({'page':page,'step':frame_step,'xml':xml,'output':file})
 info.pop('videoShape');slide_info.append(info)

presentation=E.fromstring(z.read('ppt/presentation.xml'));ids=presentation.find('p:sldIdLst',NS);ids.clear()
rels=E.fromstring(z.read('ppt/_rels/presentation.xml.rels'))
for r in list(rels):
 if r.get('Type','').endswith('/slide'):rels.remove(r)
ct=E.fromstring(z.read('[Content_Types].xml'))
for r in list(ct):
 if r.get('PartName','').startswith('/ppt/slides/slide'):ct.remove(r)
for i,frame in enumerate(frames,1):
 rid=f'rIdFrame{i}';E.SubElement(ids,f'{{{PN}}}sldId',{'id':str(255+i),f'{{{RN}}}id':rid})
 E.SubElement(rels,f'{{{PR}}}Relationship',{'Id':rid,'Type':RN+'/slide','Target':f'slides/slide{i}.xml'})
 E.SubElement(ct,f'{{{CT}}}Override',{'PartName':f'/ppt/slides/slide{i}.xml','ContentType':'application/vnd.openxmlformats-officedocument.presentationml.slide+xml'})
with ZipFile(WORK/'click-frames.pptx','w',ZIP_DEFLATED) as out:
 for n in z.namelist():
  if n.startswith('ppt/slides/') or n in ['ppt/presentation.xml','ppt/_rels/presentation.xml.rels','[Content_Types].xml']:continue
  out.writestr(n,z.read(n))
 out.writestr('ppt/presentation.xml',serialize(presentation));out.writestr('ppt/_rels/presentation.xml.rels',serialize(rels));out.writestr('[Content_Types].xml',serialize(ct))
 for i,frame in enumerate(frames,1):
  out.writestr(f'ppt/slides/slide{i}.xml',frame['xml'])
  original_rels=E.fromstring(z.read(f'ppt/slides/_rels/slide{frame["page"]}.xml.rels'))
  for r in list(original_rels):
   if r.get('Type','').endswith('/notesSlide'):original_rels.remove(r)
  out.writestr(f'ppt/slides/_rels/slide{i}.xml.rels',serialize(original_rels))
manifest={'source':SOURCE.name,'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'slideCount':22,'frameCount':len(frames),'slides':slide_info,'renderNotes':['Entrance and exit objects preserve source click order.','Movement, emphasis and transitions use discrete page states.','Auto-size map season labels expanded in rendering copy to prevent LibreOffice wrapping; source file untouched.']}
(BASE/'src/ppt-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(WORK/'frame-index.json').write_text(json.dumps([{'page':f['page'],'step':f['step'],'output':f['output']} for f in frames],indent=2))
print('Prepared',len(frames),'click frames from 22 source slides.')
print('Frame counts:',[(s['page'],len(s['frames'])) for s in slide_info])
