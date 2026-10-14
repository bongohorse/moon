// Read the pinned Bob texture metadata; fail before publishing invalid atlas types/budgets.
import java.nio.*;
import java.nio.file.*;
import java.util.*;
import com.dynamo.graphics.proto.Graphics.TextureImage;
public class TextureBudget {
    public static void main(String[] args) throws Exception {
        long total=0;
        for (String name:args) {
            byte[] bytes=Files.readAllBytes(Path.of(name));
            int header=ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).getInt();
            TextureImage texture=TextureImage.parseFrom(Arrays.copyOfRange(bytes,4,4+header));
            var image=texture.getAlternatives(0);
            if (texture.getType()!=TextureImage.Type.TYPE_2D || texture.getCount()!=1)
                throw new IllegalStateException("Single 2D atlas required: "+name);
            if (image.getWidth()>2048 || image.getHeight()>2048)
                throw new IllegalStateException("Mobile texture dimension budget exceeded: "+name);
            total+=image.getDataSize();
            System.out.printf("%s: %dx%d, %s, %d mip(s), %d bytes%n",Path.of(name).getFileName(),
                image.getWidth(),image.getHeight(),image.getFormat(),image.getMipMapSizeCount(),image.getDataSize());
        }
        if (total>8*1024*1024) throw new IllegalStateException("Atlas/soil texture budget exceeds 8 MiB");
        System.out.printf("Atlas/soil payload: %d bytes (%.3f MiB). Excludes font cache, framebuffers and engine memory.%n",total,total/1048576.0);
    }
}
