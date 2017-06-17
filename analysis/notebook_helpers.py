import os
import numpy as np
import tensorflow as tf
#from magenta.models.sketch_rnn import utils

from IPython.display import SVG, display
import svgwrite # conda install -c omnia svgwrite=1.1.6
from six.moves import xrange

# little function that displays vector images and saves them to .svg
def draw_strokes(data, factor=0.2, svg_filename = '/tmp/sketch_rnn/svg/sample.svg',
    echo=True, stroke_width=1, padx=25, pady=25, size=None,
    multipath=False,
):
  tf.gfile.MakeDirs(os.path.dirname(svg_filename))
  min_x, max_x, min_y, max_y = utils.get_bounds(data, factor)
  if size:
    w0, h0 = (max_x-min_x), (max_y-min_y)
    w, h = size
    winner = w-(padx*2)
    hinner = h-(pady*2)
    xscale = winner / w0
    yscale = hinner / h0
    scale = min(xscale, yscale)
    xpad = (w-(scale*w0))/2
    ypad = (h-(scale*h0))/2
    dims = (w, h)
  else:
    dims = (padx*2 + max_x - min_x, pady*2 + max_y - min_y)
    xpad = padx
    ypad = pady
    scale = 1

  dwg = svgwrite.Drawing(svg_filename, size=dims)
  dwg.add(dwg.rect(insert=(0, 0), size=dims,fill='white'))
  lift_pen = 1
  abs_x = xpad - min_x*scale
  abs_y = ypad - min_y*scale
  p = "M%s,%s " % (abs_x, abs_y)
  command = "m"
  the_color = "black"
  for i in xrange(len(data)):
    if (lift_pen == 1):
      if multipath:
        dwg.add(dwg.path(p).stroke(the_color,stroke_width).fill("none"))
        p = 'M{},{} '.format(abs_x, abs_y)
      command = "m"
    elif (command != "l"):
      command = "l"
    else:
      command = ""
    x = scale*float(data[i,0])/factor
    y = scale*float(data[i,1])/factor
    abs_x += x
    abs_y += y
    lift_pen = data[i, 2]
    p += command+str(x)+","+str(y)+" "
  dwg.add(dwg.path(p).stroke(the_color,stroke_width).fill("none"))
  dwg.save()
  if echo:
    display(SVG(dwg.tostring()))

# generate a 2D grid of many vector drawings
def make_grid_svg(s_list, grid_space=10.0, grid_space_x=16.0):
  grid_space = float(grid_space)
  grid_space_x = float(grid_space_x)
  def get_start_and_end(x):
    x = np.array(x)
    x = x[:, 0:2]
    x_start = x[0]
    x_end = x.sum(axis=0)
    x = x.cumsum(axis=0)
    x_max = x.max(axis=0)
    x_min = x.min(axis=0)
    center_loc = (x_max+x_min)*0.5
    return x_start-center_loc, x_end
  x_pos = 0.0
  y_pos = 0.0
  result = [[x_pos, y_pos, 1]]
  for sample in s_list:
    s = sample[0]
    grid_loc = sample[1]
    grid_y = grid_loc[0]*grid_space+grid_space*0.5
    grid_x = grid_loc[1]*grid_space_x+grid_space_x*0.5
    start_loc, delta_pos = get_start_and_end(s)

    loc_x = start_loc[0]
    loc_y = start_loc[1]
    new_x_pos = grid_x+loc_x
    new_y_pos = grid_y+loc_y
    result.append([new_x_pos-x_pos, new_y_pos-y_pos, 0])

    result += s.tolist()
    result[-1][2] = 1
    x_pos = new_x_pos+delta_pos[0]
    y_pos = new_y_pos+delta_pos[1]
  return np.array(result)

def encode(input_strokes, model, sess):
  """Return the latent vector z for given drawing (and also draw it as a side effect)
  """
  strokes = utils.to_big_strokes(input_strokes, max_len=model.hps.max_seq_len).tolist()
  strokes.insert(0, [0, 0, 1, 0, 0])
  seq_len = [len(input_strokes)]
  #draw_strokes(to_normal_strokes(np.array(strokes)))
  return sess.run(model.batch_z,
    feed_dict={
        model.input_data: [strokes],
        model.sequence_lengths: seq_len
    })[0]

# XXX
def decode(z_input=None, draw_mode=True, temperature=0.1, factor=0.2):
  z = None
  if z_input is not None:
    z = [z_input]
  sample_strokes, m = sample(sess, sample_model, seq_len=eval_model.hps.max_seq_len, temperature=temperature, z=z)
  strokes = utils.to_normal_strokes(sample_strokes)
  if draw_mode:
    draw_strokes(strokes, factor)
  return strokes
