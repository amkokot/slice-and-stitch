param(
  [int]$AlphaThreshold = 8,
  [int]$MinimumComponentPixels = 16,
  [int]$CellWidth = 355,
  [int]$HorizontalPadding = 5
)

Add-Type -AssemblyName System.Drawing
$drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
$drawingPrimitivesAssembly = [System.Drawing.Color].Assembly.Location
$collectionsAssembly = Join-Path $PSHOME 'System.Collections.dll'
$collectionsNonGenericAssembly = Join-Path $PSHOME 'System.Collections.NonGeneric.dll'
$gdiPlusAssembly = Join-Path $PSHOME 'System.Private.Windows.GdiPlus.dll'
$windowsCoreAssembly = Join-Path $PSHOME 'System.Private.Windows.Core.dll'
$ErrorActionPreference = 'Stop'

if (-not ('PaintedAtlasRepacker' -as [type])) {
  Add-Type -ReferencedAssemblies @($drawingAssembly, $drawingPrimitivesAssembly, $collectionsAssembly, $collectionsNonGenericAssembly, $gdiPlusAssembly, $windowsCoreAssembly) -TypeDefinition @'
using System;
using System.Collections;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class PaintedAtlasRepacker
{
    private sealed class Component
    {
        public int Label;
        public int Count;
        public int MinX = Int32.MaxValue;
        public int MinY = Int32.MaxValue;
        public int MaxX = Int32.MinValue;
        public int MaxY = Int32.MinValue;
        public long SumX;
        public int Frame;
    }

    public static string Repack(string inputPath, string outputPath, int frameCount, int cellWidth, int padding, int alphaThreshold, int minimumPixels)
    {
        using (var fileBitmap = new Bitmap(inputPath))
        using (var source = new Bitmap(fileBitmap.Width, fileBitmap.Height, PixelFormat.Format32bppArgb))
        {
            using (var sourceGraphics = Graphics.FromImage(source))
            {
                sourceGraphics.DrawImageUnscaled(fileBitmap, 0, 0);
            }

            int width = source.Width;
            int height = source.Height;
            var rect = new Rectangle(0, 0, width, height);
            var data = source.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            var pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            source.UnlockBits(data);

            var labels = new int[width * height];
            var queue = new int[width * height];
            var components = new ArrayList();
            int nextLabel = 0;

            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int index = y * width + x;
                    if (labels[index] != 0 || pixels[y * stride + x * 4 + 3] <= alphaThreshold) continue;

                    var component = new Component { Label = ++nextLabel };
                    int read = 0;
                    int write = 0;
                    queue[write++] = index;
                    labels[index] = component.Label;

                    while (read < write)
                    {
                        int current = queue[read++];
                        int currentX = current % width;
                        int currentY = current / width;
                        component.Count++;
                        component.SumX += currentX;
                        if (currentX < component.MinX) component.MinX = currentX;
                        if (currentX > component.MaxX) component.MaxX = currentX;
                        if (currentY < component.MinY) component.MinY = currentY;
                        if (currentY > component.MaxY) component.MaxY = currentY;

                        int fromY = Math.Max(0, currentY - 1);
                        int toY = Math.Min(height - 1, currentY + 1);
                        int fromX = Math.Max(0, currentX - 1);
                        int toX = Math.Min(width - 1, currentX + 1);
                        for (int neighborY = fromY; neighborY <= toY; neighborY++)
                        {
                            for (int neighborX = fromX; neighborX <= toX; neighborX++)
                            {
                                int neighbor = neighborY * width + neighborX;
                                if (labels[neighbor] != 0 || pixels[neighborY * stride + neighborX * 4 + 3] <= alphaThreshold) continue;
                                labels[neighbor] = component.Label;
                                queue[write++] = neighbor;
                            }
                        }
                    }

                    double centerX = component.SumX / (double)component.Count;
                    component.Frame = Math.Max(0, Math.Min(frameCount - 1, (int)Math.Floor(centerX * frameCount / width)));
                    components.Add(component);
                }
            }

            int outputWidth = frameCount * cellWidth;
            using (var output = new Bitmap(outputWidth, height, PixelFormat.Format32bppArgb))
            using (var graphics = Graphics.FromImage(output))
            {
                graphics.Clear(Color.Transparent);
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                for (int frame = 0; frame < frameCount; frame++)
                {
                    var acceptedLabels = new Hashtable();
                    int minX = Int32.MaxValue;
                    int minY = Int32.MaxValue;
                    int maxX = Int32.MinValue;
                    int maxY = Int32.MinValue;
                    int keptComponents = 0;

                    foreach (Component component in components)
                    {
                        if (component.Frame != frame || component.Count < minimumPixels) continue;
                        acceptedLabels[component.Label] = true;
                        keptComponents++;
                        minX = Math.Min(minX, component.MinX);
                        minY = Math.Min(minY, component.MinY);
                        maxX = Math.Max(maxX, component.MaxX);
                        maxY = Math.Max(maxY, component.MaxY);
                    }

                    if (acceptedLabels.Count == 0) continue;
                    using (var isolated = new Bitmap(width, height, PixelFormat.Format32bppArgb))
                    {
                        var isolatedData = isolated.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                        var isolatedPixels = new byte[stride * height];
                        for (int y = 0; y < height; y++)
                        {
                            for (int x = 0; x < width; x++)
                            {
                                int index = y * width + x;
                                if (!acceptedLabels.ContainsKey(labels[index])) continue;
                                int pixel = y * stride + x * 4;
                                isolatedPixels[pixel] = pixels[pixel];
                                isolatedPixels[pixel + 1] = pixels[pixel + 1];
                                isolatedPixels[pixel + 2] = pixels[pixel + 2];
                                isolatedPixels[pixel + 3] = pixels[pixel + 3];
                            }
                        }
                        Marshal.Copy(isolatedPixels, 0, isolatedData.Scan0, isolatedPixels.Length);
                        isolated.UnlockBits(isolatedData);

                        int sourceWidth = maxX - minX + 1;
                        int sourceHeight = maxY - minY + 1;
                        int availableWidth = cellWidth - padding * 2;
                        double scaleX = Math.Min(1.0, availableWidth / (double)sourceWidth);
                        int destinationWidth = Math.Max(1, (int)Math.Round(sourceWidth * scaleX));
                        int destinationX = frame * cellWidth + (cellWidth - destinationWidth) / 2;
                        var sourceRect = new Rectangle(minX, minY, sourceWidth, sourceHeight);
                        var destinationRect = new Rectangle(destinationX, minY, destinationWidth, sourceHeight);
                        graphics.DrawImage(isolated, destinationRect, sourceRect, GraphicsUnit.Pixel);

                    }
                }

                Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
                output.Save(outputPath, ImageFormat.Png);
            }
        }

        return outputPath;
    }
}
'@
}

$root = Split-Path -Parent $PSScriptRoot
$wardrobeRoot = Join-Path $root 'assets/characters-v3/wardrobe'
$atlases = @(
  'painted-outfit-bodies-atlas-v1.png',
  'painted-outfit-bodies-light-v1.png',
  'painted-outfit-bodies-deep-v1.png',
  'painted-outfit-bodies-atlas-v2.png',
  'painted-outfit-bodies-light-v2.png',
  'painted-outfit-bodies-deep-v2.png'
)

foreach ($atlas in $atlases) {
  $inputPath = Join-Path $wardrobeRoot $atlas
  $outputName = $atlas -replace '\.png$', '-clean.png'
  $outputPath = Join-Path $wardrobeRoot $outputName
  Write-Output "Repacking $atlas"
  [PaintedAtlasRepacker]::Repack($inputPath, $outputPath, 5, $CellWidth, $HorizontalPadding, $AlphaThreshold, $MinimumComponentPixels) | Out-Null
  Write-Output "  saved $outputName"
}
