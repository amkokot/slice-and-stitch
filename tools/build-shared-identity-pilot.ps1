param(
  [string]$AssetRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3'),
  [string]$RenderRoot = (Join-Path $PSScriptRoot '..\assets\characters-v3\modular-v4\render')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
$drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
$drawingPrimitivesAssembly = [System.Drawing.Color].Assembly.Location
$collectionsAssembly = Join-Path $PSHOME 'System.Collections.dll'
$collectionsNonGenericAssembly = Join-Path $PSHOME 'System.Collections.NonGeneric.dll'
Add-Type -ReferencedAssemblies @($drawingAssembly, $drawingPrimitivesAssembly, $collectionsAssembly, $collectionsNonGenericAssembly) -TypeDefinition @'
using System;
using System.Collections;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PaintedSkinMapper {
  private static void Hsv(byte r, byte g, byte b, out double h, out double s, out double v) {
    double rd = r / 255.0, gd = g / 255.0, bd = b / 255.0;
    double max = Math.Max(rd, Math.Max(gd, bd));
    double min = Math.Min(rd, Math.Min(gd, bd));
    double delta = max - min;
    h = 0;
    if (delta > 0.0001) {
      if (max == rd) h = 60.0 * (((gd - bd) / delta) % 6.0);
      else if (max == gd) h = 60.0 * (((bd - rd) / delta) + 2.0);
      else h = 60.0 * (((rd - gd) / delta) + 4.0);
    }
    if (h < 0) h += 360.0;
    s = max <= 0.0001 ? 0 : delta / max;
    v = max;
  }

  private static bool ProtectedFaceFeature(int x, int y, double h, double s, double v) {
    bool leftEye = x >= 68 && x <= 174 && y >= 266 && y <= 338;
    bool rightEye = x >= 188 && x <= 300 && y >= 266 && y <= 338;
    if ((leftEye || rightEye) && (v <= 0.55 || (s <= 0.22 && v >= 0.55))) return true;

    bool leftBrow = x >= 72 && x <= 176 && y >= 225 && y <= 280;
    bool rightBrow = x >= 184 && x <= 306 && y >= 225 && y <= 280;
    if ((leftBrow || rightBrow) && v <= 0.46) return true;

    bool mouth = x >= 94 && x <= 270 && y >= 374 && y <= 444;
    if (mouth && (((h <= 19.0 || h >= 338.0) && s >= 0.66) || v <= 0.42)) return true;

    // Painted ink, lashes, nostrils, and beauty marks stay neutral instead of
    // turning into muddy skin-colored details on the deeper palettes.
    return v <= 0.255;
  }

  private static bool Candidate(byte r, byte g, byte b, int x, int y, int mode) {
    if (mode == 0) {
      // The shared base is deliberately skin-only plus a neutral fitting
      // underlayer. Recoloring its complete silhouette keeps painted edge ink,
      // hands, ankles, and previously missed torso regions in one palette.
      return true;
    }
    if (mode == 1) return true;

    double h, s, v;
    Hsv(r, g, b, out h, out s, out v);
    bool skinColor = h >= 3.0 && h <= 56.0 && s >= 0.12 && s <= 0.90 && v >= 0.20;
    if (!skinColor) return false;
    if (mode == 2) {
      bool faceAndEars = y >= 104 && y <= 505 && x >= 28 && x <= 334;
      bool neckAndShoulders = y >= 430 && y <= 710;
      if (!(faceAndEars || neckAndShoulders)) return false;
      return !ProtectedFaceFeature(x, y, h, s, v);
    }
    return false;
  }

  public static Bitmap Recolor(Bitmap source, Color target, int mode) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    Rectangle bounds = new Rectangle(0, 0, source.Width, source.Height);
    BitmapData sourceData = source.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    BitmapData outputData = output.LockBits(bounds, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    int length = Math.Abs(sourceData.Stride) * source.Height;
    byte[] input = new byte[length];
    byte[] pixels = new byte[length];
    Marshal.Copy(sourceData.Scan0, input, 0, length);

    double luminanceTotal = 0;
    int luminanceCount = 0;
    for (int y = 0; y < source.Height; y++) {
      int row = y * sourceData.Stride;
      for (int x = 0; x < source.Width; x++) {
        int i = row + x * 4;
        byte a = input[i + 3];
        if (a == 0 || !Candidate(input[i + 2], input[i + 1], input[i], x, y, mode)) continue;
        double lum = (0.2126 * input[i + 2] + 0.7152 * input[i + 1] + 0.0722 * input[i]) / 255.0;
        if (lum >= 0.35 && lum <= 0.92) {
          luminanceTotal += lum;
          luminanceCount++;
        }
      }
    }
    double sourceMid = luminanceCount == 0 ? 0.62 : luminanceTotal / luminanceCount;

    Buffer.BlockCopy(input, 0, pixels, 0, length);
    for (int y = 0; y < source.Height; y++) {
      int row = y * sourceData.Stride;
      for (int x = 0; x < source.Width; x++) {
        int i = row + x * 4;
        byte a = input[i + 3];
        byte b = input[i], g = input[i + 1], r = input[i + 2];
        if (a == 0 || !Candidate(r, g, b, x, y, mode)) continue;

        double lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0;
        double minimumFactor = mode <= 1 ? 0.18 : 0.34;
        double factor = Math.Max(minimumFactor, Math.Min(1.58, lum / sourceMid));
        int mappedR = (int)Math.Round(target.R * factor);
        int mappedG = (int)Math.Round(target.G * factor);
        int mappedB = (int)Math.Round(target.B * factor);
        pixels[i + 2] = (byte)Math.Max(0, Math.Min(255, mappedR));
        pixels[i + 1] = (byte)Math.Max(0, Math.Min(255, mappedG));
        pixels[i] = (byte)Math.Max(0, Math.Min(255, mappedB));
      }
    }

    Marshal.Copy(pixels, 0, outputData.Scan0, length);
    source.UnlockBits(sourceData);
    output.UnlockBits(outputData);
    output.SetResolution(96, 96);
    return output;
  }

  public static Bitmap ChromaKeyGreen(Bitmap source) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);
    for (int y = 0; y < source.Height; y++) {
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        int strongestNonGreen = Math.Max(pixel.R, pixel.B);
        int dominance = pixel.G - strongestNonGreen;
        int alpha = pixel.A;

        // The generated extraction plate uses a vivid green field. A broad
        // dominance ramp retains antialiased hair tips while discarding the
        // field completely and removing green spill from edge pixels.
        if (pixel.G >= 150 && dominance >= 86) alpha = 0;
        else if (pixel.G >= 92 && dominance > 20) {
          double keep = Math.Max(0.0, Math.Min(1.0, (86.0 - dominance) / 66.0));
          alpha = (int)Math.Round(alpha * keep);
        }

        if (alpha == 0) {
          // Transparent chroma pixels must also have zero RGB. Otherwise
          // bicubic scaling samples their hidden green color into hair edges.
          output.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
          continue;
        }
        int green = pixel.G;
        if (dominance > 0) green = Math.Min(green, strongestNonGreen);
        output.SetPixel(x, y, Color.FromArgb(alpha, pixel.R, green, pixel.B));
      }
    }
    return output;
  }

  public static Bitmap CleanGeneratedTransparency(Bitmap source, int alphaFloor) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);
    int alphaRange = Math.Max(1, 255 - alphaFloor);
    for (int y = 0; y < source.Height; y++) {
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A <= alphaFloor) {
          output.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
          continue;
        }
        int alpha = Math.Max(0, Math.Min(255, (int)Math.Round((pixel.A - alphaFloor) * 255.0 / alphaRange)));
        output.SetPixel(x, y, Color.FromArgb(alpha, pixel.R, pixel.G, pixel.B));
      }
    }
    return output;
  }

  private static bool ProtectedHeadFeature(int x, int y, int centerX, int eyeY, double h, double s, double v) {
    bool eyes = x >= centerX - 132 && x <= centerX + 132 && y >= eyeY - 34 && y <= eyeY + 35;
    if (eyes && (v <= 0.58 || (s <= 0.24 && v >= 0.52))) return true;

    bool brows = x >= centerX - 132 && x <= centerX + 132 && y >= eyeY - 76 && y <= eyeY - 18;
    if (brows && v <= 0.52) return true;

    bool mouth = x >= centerX - 100 && x <= centerX + 100 && y >= eyeY + 60 && y <= eyeY + 116;
    if (mouth && (((h <= 20.0 || h >= 338.0) && s >= 0.38) || v <= 0.44)) return true;

    // Keep ink, lashes, nostrils, facial hair, and beauty marks neutral.
    return v <= 0.245;
  }

  private static bool HeadSkinCandidate(Bitmap source, int x, int y, int centerX, int eyeY, bool protectSilverHair) {
    Color pixel = source.GetPixel(x, y);
    if (pixel.A == 0) return false;
    double h, s, v;
    Hsv(pixel.R, pixel.G, pixel.B, out h, out s, out v);
    double faceX = (x - centerX) / 172.0;
    double faceY = (y - (eyeY + 34)) / 184.0;
    bool face = faceX * faceX + faceY * faceY <= 1.0;
    bool ears = x >= centerX - 194 && x <= centerX + 194 && y >= eyeY - 62 && y <= eyeY + 104;
    bool neck = y >= eyeY + 88 && y <= eyeY + 224 && x >= centerX - 128 && x <= centerX + 128;
    bool forehead = y >= eyeY - 164 && y < eyeY - 58 && Math.Abs(x - centerX) <= 154;
    bool spatialSkin = (face || ears || neck) && (forehead || y >= eyeY - 76);
    bool broadSkinColor = h >= 2.0 && h <= 58.0 && s >= 0.10 && s <= 0.95 && v >= 0.29;
    if (protectSilverHair && s < 0.40) return false;
    return spatialSkin && broadSkinColor && !ProtectedHeadFeature(x, y, centerX, eyeY, h, s, v);
  }

  private static void FloodSkin(bool[] candidate, bool[] mask, int width, int height, int seedX, int seedY) {
    int nearest = -1;
    int nearestDistance = Int32.MaxValue;
    for (int radius = 0; radius <= 34 && nearest < 0; radius++) {
      int fromY = Math.Max(0, seedY - radius);
      int toY = Math.Min(height - 1, seedY + radius);
      int fromX = Math.Max(0, seedX - radius);
      int toX = Math.Min(width - 1, seedX + radius);
      for (int y = fromY; y <= toY; y++) {
        for (int x = fromX; x <= toX; x++) {
          int index = y * width + x;
          if (!candidate[index] || mask[index]) continue;
          int distance = Math.Abs(x - seedX) + Math.Abs(y - seedY);
          if (distance < nearestDistance) {
            nearest = index;
            nearestDistance = distance;
          }
        }
      }
    }
    if (nearest < 0) return;

    Queue queue = new Queue();
    mask[nearest] = true;
    queue.Enqueue(nearest);
    int[] dx = new int[] { -1, 0, 1, -1, 1, -1, 0, 1 };
    int[] dy = new int[] { -1, -1, -1, 0, 0, 1, 1, 1 };
    while (queue.Count > 0) {
      int current = (int)queue.Dequeue();
      int currentX = current % width;
      int currentY = current / width;
      for (int direction = 0; direction < 8; direction++) {
        int nextX = currentX + dx[direction];
        int nextY = currentY + dy[direction];
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
        int next = nextY * width + nextX;
        if (!candidate[next] || mask[next]) continue;
        mask[next] = true;
        queue.Enqueue(next);
      }
    }
  }

  private static bool[] BuildHeadSkinMask(Bitmap source, int centerX, int eyeY, bool protectSilverHair) {
    int width = source.Width;
    int height = source.Height;
    bool[] candidate = new bool[width * height];
    bool[] mask = new bool[width * height];
    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        candidate[y * width + x] = HeadSkinCandidate(source, x, y, centerX, eyeY, protectSilverHair);
      }
    }

    FloodSkin(candidate, mask, width, height, centerX, eyeY + 44);
    FloodSkin(candidate, mask, width, height, centerX - 76, eyeY + 46);
    FloodSkin(candidate, mask, width, height, centerX + 76, eyeY + 46);
    FloodSkin(candidate, mask, width, height, centerX - 154, eyeY + 30);
    FloodSkin(candidate, mask, width, height, centerX + 154, eyeY + 30);
    FloodSkin(candidate, mask, width, height, centerX, eyeY + 150);
    return mask;
  }

  public static Bitmap RecolorHead(Bitmap source, Color target, int centerX, int eyeY, bool protectSilverHair) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);
    bool[] skinMask = BuildHeadSkinMask(source, centerX, eyeY, protectSilverHair);
    double luminanceTotal = 0;
    int luminanceCount = 0;

    for (int y = 0; y < source.Height; y++) {
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0 || !skinMask[y * source.Width + x]) continue;
        double lum = (0.2126 * pixel.R + 0.7152 * pixel.G + 0.0722 * pixel.B) / 255.0;
        if (lum >= 0.32 && lum <= 0.94) {
          luminanceTotal += lum;
          luminanceCount++;
        }
      }
    }
    double sourceMid = luminanceCount == 0 ? 0.62 : luminanceTotal / luminanceCount;

    for (int y = 0; y < source.Height; y++) {
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0) continue;
        if (!skinMask[y * source.Width + x]) {
          output.SetPixel(x, y, pixel);
          continue;
        }

        double lum = (0.2126 * pixel.R + 0.7152 * pixel.G + 0.0722 * pixel.B) / 255.0;
        double factor = Math.Max(0.31, Math.Min(1.50, lum / sourceMid));
        int mappedR = Math.Max(0, Math.Min(255, (int)Math.Round(target.R * factor)));
        int mappedG = Math.Max(0, Math.Min(255, (int)Math.Round(target.G * factor)));
        int mappedB = Math.Max(0, Math.Min(255, (int)Math.Round(target.B * factor)));
        output.SetPixel(x, y, Color.FromArgb(pixel.A, mappedR, mappedG, mappedB));
      }
    }
    return output;
  }

  public static Bitmap ExtractHairOverlay(Bitmap source, bool keepFacialHair, bool protectSilverHair, bool cleanShortHairEars) {
    int width = source.Width;
    int height = source.Height;
    bool[] skinMask = BuildHeadSkinMask(source, 256, 236, protectSilverHair);
    bool[] candidate = new bool[width * height];
    bool[] hairMask = new bool[width * height];
    Bitmap output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0 || skinMask[y * width + x]) continue;

        double dx = (x - 256) / 116.0;
        double dy = (y - 274) / 154.0;
        bool outsideFace = dx * dx + dy * dy >= 1.0;
        double h, s, v;
        Hsv(pixel.R, pixel.G, pixel.B, out h, out s, out v);
        bool brightSclera = s < 0.14 && v > 0.88;
        bool faceFeatureBand = !outsideFace && y >= 190 && y <= 285;
        candidate[y * width + x] = !brightSclera
          && !faceFeatureBand
          && (y < 240 || outsideFace);
      }
    }

    // Grow only from the crown. This retains complete painted highlights and
    // anti-aliased curls while rejecting disconnected eyes, brows, mouth ink,
    // and ear interiors that happen to share the hair palette.
    Queue queue = new Queue();
    for (int y = 0; y < Math.Min(170, height); y++) {
      for (int x = 0; x < width; x++) {
        int index = y * width + x;
        if (!candidate[index] || hairMask[index]) continue;
        hairMask[index] = true;
        queue.Enqueue(index);
      }
    }
    int[] dx8 = new int[] { -1, 0, 1, -1, 1, -1, 0, 1 };
    int[] dy8 = new int[] { -1, -1, -1, 0, 0, 1, 1, 1 };
    while (queue.Count > 0) {
      int current = (int)queue.Dequeue();
      int currentX = current % width;
      int currentY = current / width;
      for (int direction = 0; direction < 8; direction++) {
        int nextX = currentX + dx8[direction];
        int nextY = currentY + dy8[direction];
        if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
        int next = nextY * width + nextX;
        if (!candidate[next] || hairMask[next]) continue;
        hairMask[next] = true;
        queue.Enqueue(next);
      }
    }

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0) continue;
        double h, s, v;
        Hsv(pixel.R, pixel.G, pixel.B, out h, out s, out v);
        bool facialHair = keepFacialHair
          && y >= 274 && y <= 382 && Math.Abs(x - 256) <= 104
          && !skinMask[y * width + x] && v <= 0.58;
        bool shortHairEarArtifact = cleanShortHairEars
          && y >= 200 && y <= 350
          && ((x >= 70 && x <= 192) || (x >= 320 && x <= 442));
        bool shortHairLowerArtifact = cleanShortHairEars && y > 235;
        if (shortHairEarArtifact || shortHairLowerArtifact) continue;
        if (hairMask[y * width + x] || facialHair) output.SetPixel(x, y, pixel);
      }
    }
    return output;
  }

  public static void FeatherLowerEdge(Bitmap source, int startY, int endY) {
    for (int y = Math.Max(0, startY); y < Math.Min(source.Height, endY); y++) {
      double keep = 1.0 - ((y - startY) / (double)Math.Max(1, endY - startY));
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0) continue;
        int alpha = (int)Math.Round(pixel.A * keep);
        source.SetPixel(x, y, alpha == 0 ? Color.FromArgb(0, 0, 0, 0) : Color.FromArgb(alpha, pixel.R, pixel.G, pixel.B));
      }
    }
    for (int y = Math.Max(0, endY); y < source.Height; y++) {
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A > 0) source.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
      }
    }
  }

  public static void MaskNeckAttachment(Bitmap source, int centerX, int chinY, bool strictShortHairCut) {
    // Never infer the neck from eye distance: long and short cartoon faces have
    // intentionally different proportions.  The measured chin is the stable
    // anatomical boundary, and the shared body supplies the visible neck.
    int neckStart = chinY + 2;
    int fadeStart = chinY + 30;
    int fadeEnd = chinY + 78;
    for (int y = neckStart; y < source.Height; y++) {
      double verticalKeep = y < fadeStart ? 1.0 : Math.Max(0.0, 1.0 - ((y - fadeStart) / (double)Math.Max(1, fadeEnd - fadeStart)));
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0) continue;
        double h, s, v;
        Hsv(pixel.R, pixel.G, pixel.B, out h, out s, out v);
        bool likelySkin = h >= 2.0 && h <= 58.0 && s >= 0.28 && v >= 0.34;
        if (!likelySkin && !strictShortHairCut) continue;
        int distance = Math.Abs(x - centerX);
        double sideKeep = distance <= 112 ? 1.0 : Math.Max(0.0, 1.0 - ((distance - 112) / 18.0));
        int alpha = (int)Math.Round(pixel.A * verticalKeep * sideKeep);
        source.SetPixel(x, y, alpha == 0 ? Color.FromArgb(0, 0, 0, 0) : Color.FromArgb(alpha, pixel.R, pixel.G, pixel.B));
      }
    }
  }

  public static Bitmap CreateFrontIdentityLayer(Bitmap source, int jawCutY) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);
    int fadeEnd = Math.Min(source.Height - 1, jawCutY + 18);
    for (int y = 0; y < source.Height; y++) {
      double keep = y <= jawCutY ? 1.0 : y >= fadeEnd ? 0.0 : 1.0 - ((y - jawCutY) / (double)Math.Max(1, fadeEnd - jawCutY));
      for (int x = 0; x < source.Width; x++) {
        Color pixel = source.GetPixel(x, y);
        if (pixel.A == 0) continue;
        int alpha = (int)Math.Round(pixel.A * Math.Max(0.0, Math.Min(1.0, keep)));
        if (alpha > 0) output.SetPixel(x, y, Color.FromArgb(alpha, pixel.R, pixel.G, pixel.B));
      }
    }
    return output;
  }

  public static Bitmap KeepLargestAlphaComponent(Bitmap source) {
    int width = source.Width;
    int height = source.Height;
    bool[] visited = new bool[width * height];
    ArrayList largest = new ArrayList();
    int[] dx = new int[] { -1, 0, 1, -1, 1, -1, 0, 1 };
    int[] dy = new int[] { -1, -1, -1, 0, 0, 1, 1, 1 };

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        int start = y * width + x;
        if (visited[start] || source.GetPixel(x, y).A == 0) continue;
        ArrayList component = new ArrayList();
        Queue queue = new Queue();
        visited[start] = true;
        queue.Enqueue(start);
        while (queue.Count > 0) {
          int current = (int)queue.Dequeue();
          component.Add(current);
          int currentX = current % width;
          int currentY = current / width;
          for (int direction = 0; direction < 8; direction++) {
            int nextX = currentX + dx[direction];
            int nextY = currentY + dy[direction];
            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
            int next = nextY * width + nextX;
            if (visited[next]) continue;
            if (source.GetPixel(nextX, nextY).A == 0) continue;
            visited[next] = true;
            queue.Enqueue(next);
          }
        }
        if (component.Count > largest.Count) largest = component;
      }
    }

    Bitmap output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
    output.SetResolution(96, 96);
    foreach (object item in largest) {
      int index = (int)item;
      int x = index % width;
      int y = index / width;
      output.SetPixel(x, y, source.GetPixel(x, y));
    }
    return output;
  }
}
'@

New-Item -ItemType Directory -Force -Path $RenderRoot | Out-Null

$tones = @(
  @{ Id = 'light-golden'; Color = [System.Drawing.ColorTranslator]::FromHtml('#e1a77d') },
  @{ Id = 'warm-medium'; Color = [System.Drawing.ColorTranslator]::FromHtml('#c67b52') },
  @{ Id = 'deep-golden'; Color = [System.Drawing.ColorTranslator]::FromHtml('#9d5e41') },
  @{ Id = 'deep'; Color = [System.Drawing.ColorTranslator]::FromHtml('#704536') }
)

$heads = @(
  # Measured pupil and chin landmarks from the cleaned source atlases.  The
  # export maps both to one canonical cartoon face box; the painted body owns
  # the neck below that box, so heads no longer bring incompatible necks.
  @{ Id = 'head-01'; Atlas = 'cartoon-a'; Column = 0; Row = 0; CenterX = 256; EyeY = 270; ChinY = 410; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-02'; Atlas = 'cartoon-a'; Column = 1; Row = 0; CenterX = 256; EyeY = 268; ChinY = 415; Scale = 0.82; StrictNeck = $true; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-03'; Atlas = 'cartoon-a'; Column = 2; Row = 0; CenterX = 256; EyeY = 272; ChinY = 410; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-04'; Atlas = 'cartoon-a'; Column = 0; Row = 1; CenterX = 256; EyeY = 194; ChinY = 385; Scale = 0.82; StrictNeck = $true; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-05'; Atlas = 'cartoon-a'; Column = 1; Row = 1; CenterX = 256; EyeY = 221; ChinY = 382; Scale = 0.82; StrictNeck = $false; ProtectSilver = $true; FacialHair = $false },
  @{ Id = 'head-06'; Atlas = 'cartoon-a'; Column = 2; Row = 1; CenterX = 256; EyeY = 220; ChinY = 386; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-07'; Atlas = 'cartoon-b'; Column = 0; Row = 0; CenterX = 256; EyeY = 258; ChinY = 411; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-08'; Atlas = 'cartoon-b'; Column = 1; Row = 0; CenterX = 256; EyeY = 266; ChinY = 417; Scale = 0.82; StrictNeck = $false; ProtectSilver = $true; FacialHair = $false },
  @{ Id = 'head-09'; Atlas = 'cartoon-b'; Column = 2; Row = 0; CenterX = 256; EyeY = 269; ChinY = 421; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-10'; Atlas = 'cartoon-b'; Column = 0; Row = 1; CenterX = 256; EyeY = 212; ChinY = 382; Scale = 0.82; StrictNeck = $true; ProtectSilver = $true; FacialHair = $false },
  @{ Id = 'head-11'; Atlas = 'cartoon-b'; Column = 1; Row = 1; CenterX = 256; EyeY = 218; ChinY = 388; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false },
  @{ Id = 'head-12'; Atlas = 'cartoon-b'; Column = 2; Row = 1; CenterX = 256; EyeY = 226; ChinY = 397; Scale = 0.82; StrictNeck = $false; ProtectSilver = $false; FacialHair = $false }
)

$basePath = Join-Path $RenderRoot 'preset-medium-base-v1.png'
$feetPath = Join-Path $RenderRoot 'base-bare-feet-v1.png'
$headAtlasPaths = @{
  'cartoon-a' = Join-Path $AssetRoot 'identity-toppers\source-cartoon\cartoon-head-atlas-01-06-raw-v1.png'
  'cartoon-b' = Join-Path $AssetRoot 'identity-toppers\source-cartoon\cartoon-head-atlas-07-12-raw-v1.png'
}
$canonicalFacePath = Join-Path $AssetRoot 'identity-toppers\source-canonical\canonical-cartoon-face-warm-v1.png'

$base = [System.Drawing.Bitmap]::new($basePath)
$headless = [System.Drawing.Bitmap]::new($base)
$clearGraphics = [System.Drawing.Graphics]::FromImage($headless)
$clearGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$clearBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Transparent)
$clearGraphics.FillRectangle($clearBrush, 340, 0, 344, 315)
# Preserve the ankle through y=1319. Bare feet overlap it, while closed shoes
# replace only the foot area below it, preventing a pale seam in either mode.
$clearGraphics.FillRectangle($clearBrush, 260, 1320, 230, 216)
$clearGraphics.FillRectangle($clearBrush, 535, 1320, 235, 216)
$clearBrush.Dispose()
$clearGraphics.Dispose()
$base.Dispose()

$feetSource = [System.Drawing.Bitmap]::new($feetPath)
$feet = [System.Drawing.Bitmap]::new(1024, 1536, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$feet.SetResolution(96, 96)
$feetGraphics = [System.Drawing.Graphics]::FromImage($feet)
$feetGraphics.Clear([System.Drawing.Color]::Transparent)
$feetGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$feetGraphics.DrawImage($feetSource, [System.Drawing.Rectangle]::new(296, 1280, 158, 137), [System.Drawing.Rectangle]::new(289, 1280, 171, 145), [System.Drawing.GraphicsUnit]::Pixel)
$feetGraphics.DrawImage($feetSource, [System.Drawing.Rectangle]::new(573, 1280, 158, 137), [System.Drawing.Rectangle]::new(568, 1280, 169, 145), [System.Drawing.GraphicsUnit]::Pixel)
$feetGraphics.Dispose()
$feetSource.Dispose()
foreach ($tone in $tones) {
  $bodyOutput = [PaintedSkinMapper]::Recolor($headless, $tone.Color, 0)
  $bodyOutput.Save((Join-Path $RenderRoot "body-shared-$($tone.Id)-v2.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bodyOutput.Dispose()

  $feetOutput = [PaintedSkinMapper]::Recolor($feet, $tone.Color, 1)
  for ($y = 1280; $y -lt 1320; $y++) {
    $blend = ($y - 1280) / 40.0
    for ($x = 260; $x -lt 770; $x++) {
      $pixel = $feetOutput.GetPixel($x, $y)
      if ($pixel.A -eq 0) { continue }
      $alpha = [int][Math]::Round($pixel.A * $blend)
      $feetOutput.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
    }
  }
  $feetOutput.Save((Join-Path $RenderRoot "feet-shared-$($tone.Id)-v2.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $feetOutput.Dispose()
}
$headless.Dispose()
$feet.Dispose()

$keyedAtlases = @{}
foreach ($atlasId in $headAtlasPaths.Keys) {
  $headAtlas = [System.Drawing.Bitmap]::new($headAtlasPaths[$atlasId])
  $keyedAtlas = [PaintedSkinMapper]::CleanGeneratedTransparency($headAtlas, 218)
  $keyedAtlas.Save((Join-Path $AssetRoot "identity-toppers\forward-head-atlas-$atlasId.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $keyedAtlases[$atlasId] = $keyedAtlas
  $headAtlas.Dispose()
}
$cellWidth = 512
$cellHeight = 512

# Register the one canonical painted skull to the same eye/chin coordinates as
# every modular topper. All presets reuse these exact pixels; only overlays and
# the deterministic skin palette change afterward.
$canonicalSource = [System.Drawing.Bitmap]::new($canonicalFacePath)
$canonicalRegistered = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$canonicalRegistered.SetResolution(96, 96)
$canonicalGraphics = [System.Drawing.Graphics]::FromImage($canonicalRegistered)
$canonicalGraphics.Clear([System.Drawing.Color]::Transparent)
$canonicalGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$canonicalGraphics.DrawImage($canonicalSource,
  [System.Drawing.Rectangle]::new(68, 35, 376, 419),
  [System.Drawing.Rectangle]::new(0, 0, 1254, 1254),
  [System.Drawing.GraphicsUnit]::Pixel)
$canonicalGraphics.Dispose()
$canonicalSource.Dispose()
$canonicalRegistered.Save((Join-Path $AssetRoot 'identity-toppers\canonical-face-warm-registered-v1.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$canonicalByTone = @{}
foreach ($tone in $tones) {
  $canonicalTone = [PaintedSkinMapper]::RecolorHead($canonicalRegistered, $tone.Color, 256, 236, $false)
  $canonicalTone.Save((Join-Path $AssetRoot "identity-toppers\canonical-face-$($tone.Id)-v1.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $canonicalByTone[$tone.Id] = $canonicalTone
}

foreach ($head in $heads) {
  $keyedAtlas = $keyedAtlases[$head.Atlas]
  $sourceCell = [System.Drawing.Bitmap]::new($cellWidth, $cellHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $sourceGraphics = [System.Drawing.Graphics]::FromImage($sourceCell)
  $sourceGraphics.Clear([System.Drawing.Color]::Transparent)
  $sourceRect = [System.Drawing.Rectangle]::new($head.Column * $cellWidth, $head.Row * $cellHeight, $cellWidth, $cellHeight)
  $sourceGraphics.DrawImage($keyedAtlas, [System.Drawing.Rectangle]::new(0, 0, $cellWidth, $cellHeight), $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  $sourceGraphics.Dispose()
  [PaintedSkinMapper]::MaskNeckAttachment($sourceCell, $head.CenterX, $head.ChinY, $head.StrictNeck)
  $cleanCell = [PaintedSkinMapper]::KeepLargestAlphaComponent($sourceCell)
  $sourceCell.Dispose()

  foreach ($tone in $tones) {
    $mappedHead = [PaintedSkinMapper]::RecolorHead($cleanCell, $tone.Color, $head.CenterX, $head.EyeY, $head.ProtectSilver)
    # Three vertical slices preserve hair volume above and below the face while
    # normalizing only the eye-to-chin span.  This avoids scaling a long face
    # as though it were a short face and gives every identity the same jaw/body
    # attachment without making the hairstyles clones.
    $topper = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $topper.SetResolution(96, 96)
    $topperGraphics = [System.Drawing.Graphics]::FromImage($topper)
    $topperGraphics.Clear([System.Drawing.Color]::Transparent)
    $topperGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $topperScale = 0.960
    $targetEyeY = 236
    $targetChinY = 382
    $topperWidth = [int][Math]::Round(512 * $topperScale)
    $topperX = [int][Math]::Round(256 - ($head.CenterX * $topperScale))
    $upperHeight = [int][Math]::Round($head.EyeY * $topperScale)
    $lowerHeight = [int][Math]::Round((512 - $head.ChinY) * $topperScale)
    $topperGraphics.DrawImage($mappedHead,
      [System.Drawing.Rectangle]::new($topperX, $targetEyeY - $upperHeight, $topperWidth, $upperHeight),
      [System.Drawing.Rectangle]::new(0, 0, 512, $head.EyeY),
      [System.Drawing.GraphicsUnit]::Pixel)
    $topperGraphics.DrawImage($mappedHead,
      [System.Drawing.Rectangle]::new($topperX, $targetEyeY, $topperWidth, $targetChinY - $targetEyeY),
      [System.Drawing.Rectangle]::new(0, $head.EyeY, 512, $head.ChinY - $head.EyeY),
      [System.Drawing.GraphicsUnit]::Pixel)
    $topperGraphics.DrawImage($mappedHead,
      [System.Drawing.Rectangle]::new($topperX, $targetChinY, $topperWidth, $lowerHeight),
      [System.Drawing.Rectangle]::new(0, $head.ChinY, 512, 512 - $head.ChinY),
      [System.Drawing.GraphicsUnit]::Pixel)
    $topperGraphics.Dispose()
    $topper.Save((Join-Path $AssetRoot "identity-toppers\forward-$($head.Id)-$($tone.Id)-v7.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $frontTopper = [PaintedSkinMapper]::CreateFrontIdentityLayer($topper, $targetChinY)
    $frontTopper.Save((Join-Path $AssetRoot "identity-toppers\forward-$($head.Id)-$($tone.Id)-front-v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $frontTopper.Dispose()

    # Canonical-head pilot: exact shared face/jaw pixels plus the identity's
    # authored hair silhouette. This is intentionally emitted beside v7 until
    # visual QA proves it is stronger than the per-portrait face construction.
    $cleanShortHairEars = @('head-02', 'head-04', 'head-10') -contains $head.Id
    $hairOverlay = [PaintedSkinMapper]::ExtractHairOverlay($topper, $head.FacialHair, $head.ProtectSilver, $cleanShortHairEars)
    $canonicalComposite = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $canonicalComposite.SetResolution(96, 96)
    $canonicalCompositeGraphics = [System.Drawing.Graphics]::FromImage($canonicalComposite)
    $canonicalCompositeGraphics.Clear([System.Drawing.Color]::Transparent)
    $canonicalCompositeGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $canonicalCompositeGraphics.DrawImage($canonicalByTone[$tone.Id], 0, 0, 512, 512)
    # The legacy portrait openings were wider than the canonical skull. Pull
    # only the hairstyle inward around the fixed center; this lets every style
    # meet the same temples and ears without changing the face or body anchor.
    $canonicalCompositeGraphics.DrawImage($hairOverlay,
      [System.Drawing.Rectangle]::new(32, 0, 448, 512),
      [System.Drawing.Rectangle]::new(0, 0, 512, 512),
      [System.Drawing.GraphicsUnit]::Pixel)
    $canonicalCompositeGraphics.Dispose()
    $canonicalComposite.Save((Join-Path $AssetRoot "identity-toppers\forward-$($head.Id)-$($tone.Id)-v8.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $canonicalFront = [PaintedSkinMapper]::CreateFrontIdentityLayer($canonicalComposite, $targetChinY)
    $canonicalFront.Save((Join-Path $AssetRoot "identity-toppers\forward-$($head.Id)-$($tone.Id)-front-v6.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $canonicalFront.Dispose()
    $canonicalComposite.Dispose()
    $hairOverlay.Dispose()
    $topper.Dispose()

    $canvas = [System.Drawing.Bitmap]::new(1024, 1536, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $canvas.SetResolution(96, 96)
    $canvasGraphics = [System.Drawing.Graphics]::FromImage($canvas)
    $canvasGraphics.Clear([System.Drawing.Color]::Transparent)
    $canvasGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $canvasGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $registeredWidth = [int][Math]::Round($cellWidth * $head.Scale)
    $registeredHeight = [int][Math]::Round($cellHeight * $head.Scale)
    $registeredX = [int][Math]::Round(512 - ($head.CenterX * $head.Scale))
    $registeredY = [int][Math]::Round(192 - ($head.EyeY * $head.Scale))
    $canvasGraphics.DrawImage($mappedHead, $registeredX, $registeredY, $registeredWidth, $registeredHeight)
    $canvasGraphics.Dispose()
    $mappedHead.Dispose()
    $canvas.Save((Join-Path $RenderRoot "$($head.Id)-$($tone.Id)-v3.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
  }
  $cleanCell.Dispose()
}

$keyedAtlases.Values | ForEach-Object { $_.Dispose() }
$canonicalByTone.Values | ForEach-Object { $_.Dispose() }
$canonicalRegistered.Dispose()
Write-Host "Built $($heads.Count) landmark-normalized painterly heads across $($tones.Count) deterministic skin palettes."
